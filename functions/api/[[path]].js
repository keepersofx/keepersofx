// Keepers of X - Cloudflare Pages Function

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract the API path
    const path = url.pathname.replace('/api', '');
    
    // Route requests
    if (path === '/profiles') {
      return handleGetProfiles(env, corsHeaders);
    }
    
    if (path === '/stats') {
      return handleGetStats(env, corsHeaders);
    }
    
    if (path === '/submit' && request.method === 'POST') {
      return handleSubmit(request, env, corsHeaders);
    }

    return new Response('Not Found', { status: 404 });
    
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Get all profiles
async function handleGetProfiles(env, corsHeaders) {
  try {
    const result = await env.DB.prepare(`
      SELECT handle, join_date, followers, location, profile_image, created_at
      FROM profiles
      ORDER BY join_date ASC
      LIMIT 1000
    `).all();

    return new Response(JSON.stringify({ profiles: result.results || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return new Response(JSON.stringify({ profiles: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Get statistics
async function handleGetStats(env, corsHeaders) {
  try {
    const totalResult = await env.DB.prepare('SELECT COUNT(*) as count FROM profiles').first();
    const total = totalResult?.count || 0;

    const earliestResult = await env.DB.prepare(`
      SELECT strftime('%Y', join_date) as year 
      FROM profiles 
      WHERE join_date IS NOT NULL 
      ORDER BY join_date ASC 
      LIMIT 1
    `).first();
    const earliestYear = earliestResult?.year || null;

    const countriesResult = await env.DB.prepare(`
      SELECT COUNT(DISTINCT location) as count 
      FROM profiles 
      WHERE location IS NOT NULL AND location != ''
    `).first();
    const countries = countriesResult?.count || 0;

    return new Response(JSON.stringify({
      total,
      earliestYear,
      countries
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return new Response(JSON.stringify({ 
      total: 0, 
      earliestYear: null, 
      countries: 0 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle profile submission
async function handleSubmit(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const handle = body.handle?.trim().toLowerCase();

    if (!handle) {
      return new Response(JSON.stringify({ error: 'Handle is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if profile already exists
    const existing = await env.DB.prepare('SELECT handle FROM profiles WHERE handle = ?')
      .bind(handle)
      .first();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Profile already exists in the chronicles' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Scrape profile data from X
    const profileData = await scrapeXProfile(handle);

    if (!profileData) {
      return new Response(JSON.stringify({ error: 'Could not find profile or failed to scrape data' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Insert into database
    await env.DB.prepare(`
      INSERT INTO profiles (handle, join_date, followers, location, profile_image, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      handle,
      profileData.joinDate,
      profileData.followers,
      profileData.location,
      profileData.profileImage
    ).run();

    return new Response(JSON.stringify({ 
      success: true,
      profile: {
        handle,
        ...profileData
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error submitting profile:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to inscribe profile' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Scrape X/Twitter profile data
async function scrapeXProfile(handle) {
  try {
    const response = await fetch(`https://x.com/${handle}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    if (!response.ok) {
      throw new Error('Profile not found');
    }

    const html = await response.text();

    // Join date
    let joinDate = null;
    const joinMatch = html.match(/Joined\s+([A-Z][a-z]+)\s+(\d{4})/i);
    if (joinMatch) {
      const [, month, year] = joinMatch;
      joinDate = `${year}-${getMonthNumber(month)}-01`;
    }

    // Followers
    let followers = 0;
    const followersMatch = html.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*[KMB]?\s*Followers/i);
    if (followersMatch) {
      followers = parseFollowerCount(followersMatch[1]);
    }

    // Location
    let location = null;
    const locationMatch = html.match(/"location":\{"formatted":"([^"]+)"/);
    if (locationMatch) {
      location = locationMatch[1];
    }

    // Profile image
    let profileImage = null;
    const imageMatch = html.match(/"profile_image_url_https":"([^"]+)"/);
    if (imageMatch) {
      profileImage = imageMatch[1].replace(/\\/g, '');
    }

    if (!joinDate) {
      throw new Error('Could not extract join date');
    }

    return {
      joinDate,
      followers,
      location,
      profileImage
    };

  } catch (error) {
    console.error('Scraping error:', error);
    return null;
  }
}

function getMonthNumber(monthName) {
  const months = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12'
  };
  return months[monthName.toLowerCase()] || '01';
}

function parseFollowerCount(str) {
  const cleaned = str.replace(/,/g, '');
  const num = parseFloat(cleaned);
  
  if (str.includes('K')) return Math.floor(num * 1000);
  if (str.includes('M')) return Math.floor(num * 1000000);
  if (str.includes('B')) return Math.floor(num * 1000000000);
  
  return Math.floor(num);
}
