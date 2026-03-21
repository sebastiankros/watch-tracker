'use client';

import { useState } from 'react';
import { SearchIcon, SpinnerIcon, ExternalLinkIcon, TrendUpIcon, TrendDownIcon, TagIcon } from '@/components/Icons';
import Breadcrumbs from '@/components/Breadcrumbs';

interface Listing {
  title: string;
  price: number | null;
  url: string;
  source: string;
  postedAgo: string;
}

interface SearchResult {
  query: string;
  listings: Listing[];
  marketPrice: number | null;
  medianPrice: number | null;
  lowPrice: number | null;
  highPrice: number | null;
  sampleSize: number;
  scrapedAt: string;
  searchUrls: {
    chrono24: string;
    ebay: string;
    ebaySold: string;
    watchRecon: string;
    reddit: string;
  };
}

const POPULAR_SEARCHES = [
  'Tudor Black Bay 58',
  'Omega Speedmaster Reduced',
  'Seiko Presage',
  'Hamilton Khaki Field',
  'Tissot PRX',
  'Orient Bambino',
  'Longines Conquest',
  'Oris Aquis',
  'Sinn 556',
  'Mido Baroncelli',
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(searchQuery?: string) {
    const q = searchQuery || query;
    if (!q || q.length < 2) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Search failed');
      }
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  function handleQuickSearch(q: string) {
    setQuery(q);
    handleSearch(q);
  }

  function getSourceColor(source: string) {
    if (source.includes('Reddit')) return 'text-orange-400 bg-orange-400/10';
    if (source.includes('WatchUSeek')) return 'text-blue-400 bg-blue-400/10';
    if (source.includes('Chrono24')) return 'text-yellow-400 bg-yellow-400/10';
    if (source.includes('eBay')) return 'text-green-400 bg-green-400/10';
    if (source.includes('Omega')) return 'text-purple-400 bg-purple-400/10';
    return 'text-gray-400 bg-gray-400/10';
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Search', href: '/search' }]} />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Live Market Search</h1>
        <p className="text-gray-400 text-sm">
          Search any watch model to get real-time market prices and active listings
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex gap-3"
        >
          <div className="flex-1 relative">
            <SearchIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search watches... (e.g. Tudor Black Bay 58, Omega Speedmaster)"
              className="w-full bg-[#1a1a24] border border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || query.length < 2}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-xl transition flex items-center gap-2"
          >
            {loading ? <SpinnerIcon className="w-5 h-5" /> : <SearchIcon className="w-5 h-5" />}
            Search
          </button>
        </form>
      </div>

      {/* Popular Searches */}
      {!results && !loading && (
        <div className="mb-8">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Popular searches</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((s) => (
              <button
                key={s}
                onClick={() => handleQuickSearch(s)}
                className="px-3 py-1.5 bg-[#1a1a24] border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white hover:border-gray-600 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <SpinnerIcon className="w-10 h-10 text-blue-400 mb-4" />
          <p className="text-gray-400">Scraping live market data...</p>
          <p className="text-gray-600 text-sm mt-1">This may take a few seconds</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div>
          {/* Market Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-[#1a1a24] border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Market Price</p>
              <p className="text-xl font-bold text-white">
                {results.marketPrice ? `$${results.marketPrice.toLocaleString()}` : 'N/A'}
              </p>
            </div>
            <div className="bg-[#1a1a24] border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Median</p>
              <p className="text-xl font-bold text-white">
                {results.medianPrice ? `$${results.medianPrice.toLocaleString()}` : 'N/A'}
              </p>
            </div>
            <div className="bg-[#1a1a24] border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Low</p>
              <p className="text-xl font-bold text-green-400">
                {results.lowPrice ? `$${results.lowPrice.toLocaleString()}` : 'N/A'}
              </p>
            </div>
            <div className="bg-[#1a1a24] border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">High</p>
              <p className="text-xl font-bold text-red-400">
                {results.highPrice ? `$${results.highPrice.toLocaleString()}` : 'N/A'}
              </p>
            </div>
            <div className="bg-[#1a1a24] border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Sample Size</p>
              <p className="text-xl font-bold text-white">{results.sampleSize}</p>
            </div>
          </div>

          {/* Marketplace Links */}
          <div className="bg-[#1a1a24] border border-gray-800 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Search on marketplaces</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(results.searchUrls).map(([key, url]) => {
                const labels: Record<string, string> = {
                  chrono24: 'Chrono24',
                  ebay: 'eBay Active',
                  ebaySold: 'eBay Sold',
                  watchRecon: 'WatchRecon',
                  reddit: 'r/Watchexchange',
                };
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition"
                  >
                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                    {labels[key] || key}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Listings */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Active Listings ({results.listings.length})
            </h2>
            <p className="text-xs text-gray-500">
              Scraped {new Date(results.scrapedAt).toLocaleTimeString()}
            </p>
          </div>

          {results.listings.length === 0 ? (
            <div className="bg-[#1a1a24] border border-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-400">No listings found in the $500-$7,000 range.</p>
              <p className="text-gray-600 text-sm mt-1">Try a different search term or check the marketplace links above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.listings.map((listing, i) => {
                const belowMarket = results.marketPrice && listing.price
                  ? results.marketPrice - listing.price
                  : null;
                const pctBelow = results.marketPrice && listing.price
                  ? ((results.marketPrice - listing.price) / results.marketPrice) * 100
                  : null;

                return (
                  <a
                    key={i}
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-[#1a1a24] border border-gray-800 hover:border-gray-600 rounded-xl p-4 transition group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSourceColor(listing.source)}`}>
                            {listing.source}
                          </span>
                          {listing.postedAgo && (
                            <span className="text-xs text-gray-600">{listing.postedAgo}</span>
                          )}
                        </div>
                        <h3 className="text-sm text-gray-300 group-hover:text-white truncate transition">
                          {listing.title}
                        </h3>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-white">
                          {listing.price ? `$${listing.price.toLocaleString()}` : 'N/A'}
                        </p>
                        {belowMarket !== null && belowMarket > 0 && pctBelow !== null && (
                          <div className="flex items-center gap-1 text-green-400">
                            <TrendDownIcon className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">
                              ${belowMarket.toLocaleString()} below ({pctBelow.toFixed(1)}%)
                            </span>
                          </div>
                        )}
                        {belowMarket !== null && belowMarket < 0 && pctBelow !== null && (
                          <div className="flex items-center gap-1 text-red-400">
                            <TrendUpIcon className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">
                              ${Math.abs(belowMarket).toLocaleString()} above ({Math.abs(pctBelow).toFixed(1)}%)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-600 group-hover:text-gray-500 transition">
                      <ExternalLinkIcon className="w-3 h-3" />
                      <span className="truncate">{listing.url.substring(0, 80)}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
