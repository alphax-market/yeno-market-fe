import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RssItem {
  headline: string;
  source_url: string;
  source_name: string;
  category: string;
  suggested_market_title?: string;
  suggested_end_date?: string;
}

const MAX_RSS_FEEDS_PER_REQUEST = 5;
const MAX_HEADLINE_LENGTH = 500;
const MAX_URL_LENGTH = 2048;

function validateRssUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL must be a non-empty string' };
  }
  
  if (url.length > MAX_URL_LENGTH) {
    return { valid: false, error: `URL exceeds maximum length of ${MAX_URL_LENGTH} characters` };
  }
  
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use http or https protocol' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

function sanitizeString(str: string, maxLength: number): string {
  if (!str || typeof str !== 'string') return '';
  return str.trim().substring(0, maxLength);
}

function parseRssXml(xml: string, sourceUrl: string): RssItem[] {
  const items: RssItem[] = [];
  const hostname = new URL(sourceUrl).hostname.replace("www.", "");
  
  // Simple XML parsing for RSS items
  const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
  
  for (const itemXml of itemMatches.slice(0, 10)) { // Limit to 10 items per feed
    const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/i);
    const linkMatch = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[)?([^\]<\s]+)(?:\]\]>)?<\/link>/i);
    
    if (titleMatch && titleMatch[1]) {
      let headline = titleMatch[1].trim().replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
      let link = linkMatch?.[1]?.trim() || sourceUrl;
      
      // Sanitize and validate extracted content
      headline = sanitizeString(headline, MAX_HEADLINE_LENGTH);
      link = sanitizeString(link, MAX_URL_LENGTH);
      
      // Skip items with invalid links
      const linkValidation = validateRssUrl(link);
      if (!linkValidation.valid) {
        link = sourceUrl; // Fallback to source URL
      }
      
      if (headline) {
        // Generate a suggested market title from headline
        const suggestedTitle = generateMarketTitle(headline);
        
        // Generate suggested end date (30 days from now)
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        
        items.push({
          headline,
          source_url: link,
          source_name: sanitizeString(hostname, 100),
          category: detectCategory(headline),
          suggested_market_title: suggestedTitle,
          suggested_end_date: endDate.toISOString(),
        });
      }
    }
  }
  
  return items;
}

function generateMarketTitle(headline: string): string {
  // Convert headline to a yes/no question format
  const cleaned = headline.replace(/[?!.]+$/, "").trim();
  
  // Check if it already looks like a question
  if (headline.toLowerCase().startsWith("will") || headline.toLowerCase().startsWith("can") || headline.toLowerCase().startsWith("is")) {
    return headline.endsWith("?") ? headline : headline + "?";
  }
  
  // Try to convert statements to questions
  const words = cleaned.split(" ");
  if (words.length > 3) {
    const truncated = cleaned.substring(0, 80);
    return `Will "${truncated}${cleaned.length > 80 ? "..." : ""}" happen?`;
  }
  
  return `Will this happen: ${cleaned}?`;
}

function detectCategory(headline: string): string {
  const lower = headline.toLowerCase();
  
  if (lower.includes("bitcoin") || lower.includes("crypto") || lower.includes("ethereum") || lower.includes("blockchain") || lower.includes("btc") || lower.includes("eth")) {
    return "crypto";
  }
  if (lower.includes("ai") || lower.includes("tech") || lower.includes("software") || lower.includes("apple") || lower.includes("google") || lower.includes("microsoft") || lower.includes("openai")) {
    return "technology";
  }
  if (lower.includes("stock") || lower.includes("market") || lower.includes("fed") || lower.includes("rate") || lower.includes("economy") || lower.includes("inflation")) {
    return "finance";
  }
  if (lower.includes("election") || lower.includes("president") || lower.includes("congress") || lower.includes("senate") || lower.includes("vote") || lower.includes("political")) {
    return "politics";
  }
  if (lower.includes("nba") || lower.includes("nfl") || lower.includes("soccer") || lower.includes("football") || lower.includes("championship") || lower.includes("game") || lower.includes("team")) {
    return "sports";
  }
  if (lower.includes("space") || lower.includes("nasa") || lower.includes("research") || lower.includes("study") || lower.includes("science") || lower.includes("climate")) {
    return "science";
  }
  
  return "news";
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create client with anon key for auth verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    
    // === AUTHENTICATION CHECK ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    // === AUTHORIZATION CHECK ===
    // Verify user has a profile (basic authorization - user exists in system)
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error("User not authorized:", profileError?.message);
      return new Response(
        JSON.stringify({ error: "Access denied - user profile not found" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === INPUT VALIDATION ===
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { rssUrls } = body;

    if (!rssUrls || !Array.isArray(rssUrls)) {
      return new Response(
        JSON.stringify({ error: "rssUrls must be an array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (rssUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: "rssUrls array cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting: max feeds per request
    if (rssUrls.length > MAX_RSS_FEEDS_PER_REQUEST) {
      return new Response(
        JSON.stringify({ error: `Maximum ${MAX_RSS_FEEDS_PER_REQUEST} RSS feeds per request` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate each URL
    const invalidUrls: string[] = [];
    for (const url of rssUrls) {
      const validation = validateRssUrl(url);
      if (!validation.valid) {
        invalidUrls.push(`${url}: ${validation.error}`);
      }
    }

    if (invalidUrls.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid RSS URL(s)", 
          details: invalidUrls 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching RSS feeds from ${rssUrls.length} sources for user ${user.id}`);

    const allItems: RssItem[] = [];
    const errors: string[] = [];

    // Fetch all RSS feeds in parallel
    const fetchPromises = rssUrls.map(async (url: string) => {
      try {
        console.log(`Fetching: ${url}`);
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)",
            "Accept": "application/rss+xml, application/xml, text/xml",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const xml = await response.text();
        const items = parseRssXml(xml, url);
        console.log(`Parsed ${items.length} items from ${url}`);
        return items;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error fetching ${url}:`, errorMessage);
        errors.push(`${url}: ${errorMessage}`);
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    results.forEach(items => allItems.push(...items));

    console.log(`Total items fetched: ${allItems.length}`);

    if (allItems.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "No news items found", 
          errors,
          inserted: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing headlines to avoid duplicates
    const headlines = allItems.map(item => item.headline);
    const { data: existingTopics } = await supabaseService
      .from("news_topics")
      .select("headline")
      .in("headline", headlines);

    const existingHeadlines = new Set(existingTopics?.map(t => t.headline) || []);
    const newItems = allItems.filter(item => !existingHeadlines.has(item.headline));

    console.log(`New items to insert: ${newItems.length}`);

    if (newItems.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "All news items already exist", 
          errors,
          inserted: 0,
          total_fetched: allItems.length
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert new items
    const { error: insertError } = await supabaseService
      .from("news_topics")
      .insert(newItems);

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    console.log(`Successfully inserted ${newItems.length} news topics`);

    return new Response(
      JSON.stringify({
        message: "RSS feeds fetched successfully",
        inserted: newItems.length,
        total_fetched: allItems.length,
        duplicates_skipped: allItems.length - newItems.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in fetch-rss-news:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
