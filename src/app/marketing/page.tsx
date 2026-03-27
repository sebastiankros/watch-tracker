'use client';

import { useEffect, useState, useCallback } from 'react';
import { cachedFetch } from '@/lib/api-cache';
import { formatPrice } from '@/lib/utils';
import { generatePost, getContentIdeas, POST_TYPE_LABELS, PLATFORM_LABELS, type Platform, type PostType } from '@/lib/marketing';
import { MarketingIcon, CopyIcon, ShareIcon, HashtagIcon, CalendarIcon, TrashIcon, SpinnerIcon, SearchIcon } from '@/components/Icons';
import Breadcrumbs from '@/components/Breadcrumbs';
import { SkeletonTable } from '@/components/Skeleton';

interface Watch {
  id: string;
  brand: string;
  model: string;
  reference: string;
  marketPrice: number;
  previousPrice: number | null;
  price30dAgo: number | null;
  confidence: number;
}

interface Deal {
  id: string;
  watchId: string;
  brand: string;
  model: string;
  reference: string;
  listingPrice: number;
  marketPrice: number;
  discount: number;
  savings: number;
  condition: string | null;
  source: string;
  url: string;
}

interface SavedPost {
  id: string;
  watchId: string | null;
  brand: string | null;
  model: string | null;
  platform: string;
  content: string;
  type: string;
  status: string;
  createdAt: string;
  postedAt: string | null;
}

type Tab = 'generator' | 'ideas' | 'saved';

export default function MarketingPage() {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('generator');

  // Generator state
  const [selectedWatch, setSelectedWatch] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram');
  const [selectedType, setSelectedType] = useState<PostType>('deal');
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [watchSearch, setWatchSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [watchData, dealData, postData] = await Promise.all([
      cachedFetch<{ watches: Watch[] }>('/api/watches'),
      cachedFetch<{ deals: Deal[] }>('/api/deals'),
      fetch('/api/marketing/posts').then(r => r.json()),
    ]);
    setWatches(watchData.watches || []);
    setDeals(dealData.deals || []);
    setSavedPosts(postData.posts || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Build watch data for generator
  const getWatchData = useCallback(() => {
    if (!selectedWatch) return null;

    // Check if it's a deal
    const deal = deals.find(d => d.watchId === selectedWatch);
    const watch = watches.find(w => w.id === selectedWatch);

    if (deal) {
      return {
        brand: deal.brand,
        model: deal.model,
        reference: deal.reference,
        marketPrice: deal.marketPrice,
        listingPrice: deal.listingPrice,
        discount: deal.discount,
        savings: deal.savings,
        condition: deal.condition || undefined,
        source: deal.source,
        url: deal.url,
        previousPrice: watch?.previousPrice,
        price30dAgo: watch?.price30dAgo,
      };
    }

    if (watch) {
      return {
        brand: watch.brand,
        model: watch.model,
        reference: watch.reference,
        marketPrice: watch.marketPrice,
        previousPrice: watch.previousPrice,
        price30dAgo: watch.price30dAgo,
      };
    }

    return null;
  }, [selectedWatch, deals, watches]);

  // Generate post
  const handleGenerate = useCallback(() => {
    const data = getWatchData();
    if (!data) return;
    const content = generatePost(data, selectedPlatform, selectedType);
    setGeneratedContent(content);
    setCopied(false);
  }, [getWatchData, selectedPlatform, selectedType]);

  // Copy to clipboard
  const handleCopy = useCallback(async (text?: string) => {
    const content = text || generatedContent;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedContent]);

  // Save post
  const handleSave = useCallback(async () => {
    if (!generatedContent) return;
    setSaving(true);
    const watch = watches.find(w => w.id === selectedWatch);
    await fetch('/api/marketing/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        watchId: selectedWatch || null,
        brand: watch?.brand || null,
        model: watch?.model || null,
        platform: selectedPlatform,
        content: generatedContent,
        type: selectedType,
      }),
    });
    const postData = await fetch('/api/marketing/posts').then(r => r.json());
    setSavedPosts(postData.posts || []);
    setSaving(false);
    setActiveTab('saved');
  }, [generatedContent, selectedWatch, selectedPlatform, selectedType, watches]);

  // Delete post
  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/marketing/posts?id=${id}`, { method: 'DELETE' });
    setSavedPosts(prev => prev.filter(p => p.id !== id));
  }, []);

  // Mark as posted
  const handleMarkPosted = useCallback(async (id: string) => {
    await fetch('/api/marketing/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'posted' }),
    });
    setSavedPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'posted', postedAt: new Date().toISOString() } : p));
  }, []);

  // Content ideas
  const ideas = watches.length > 0
    ? getContentIdeas(watches.map(w => ({
        brand: w.brand,
        model: w.model,
        reference: w.reference,
        marketPrice: w.marketPrice,
        previousPrice: w.previousPrice,
        price30dAgo: w.price30dAgo,
        listingPrice: deals.find(d => d.watchId === w.id)?.listingPrice,
        discount: deals.find(d => d.watchId === w.id)?.discount,
        savings: deals.find(d => d.watchId === w.id)?.savings,
      })))
    : [];

  // Filtered watches for search
  const filteredWatches = watches.filter(w =>
    `${w.brand} ${w.model} ${w.reference}`.toLowerCase().includes(watchSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Marketing' }]} />
        <SkeletonTable rows={6} cols={4} />
      </div>
    );
  }

  const stats = {
    totalPosts: savedPosts.length,
    posted: savedPosts.filter(p => p.status === 'posted').length,
    drafts: savedPosts.filter(p => p.status === 'draft').length,
    ideas: ideas.length,
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Marketing' }]} />

      <div>
        <h1 className="text-2xl font-bold text-white">Marketing</h1>
        <p className="text-sm text-gray-500">Generate and manage social media content for your watches</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Content Ideas', value: stats.ideas, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          { label: 'Drafts', value: stats.drafts, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Posted', value: stats.posted, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Total Posts', value: stats.totalPosts, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border rounded-xl p-4`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111118] border border-gray-800 rounded-lg p-1">
        {([
          { id: 'generator' as Tab, label: 'Post Generator', Icon: MarketingIcon },
          { id: 'ideas' as Tab, label: 'Content Ideas', Icon: HashtagIcon },
          { id: 'saved' as Tab, label: 'Saved Posts', Icon: CalendarIcon },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.Icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Generator Tab */}
      {activeTab === 'generator' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div className="bg-[#111118] border border-gray-800 rounded-xl p-5 space-y-4">
              <h2 className="text-lg font-semibold text-white">Generate Post</h2>

              {/* Watch selector */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Select Watch</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={watchSearch}
                    onChange={(e) => setWatchSearch(e.target.value)}
                    placeholder="Search watches..."
                    className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none"
                  />
                </div>
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
                  {filteredWatches.slice(0, 20).map((w) => {
                    const hasDeal = deals.some(d => d.watchId === w.id);
                    return (
                      <button
                        key={w.id}
                        onClick={() => { setSelectedWatch(w.id); setWatchSearch(''); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                          selectedWatch === w.id
                            ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                            : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <span className="font-medium">{w.brand}</span> {w.model}
                        <span className="text-gray-500 ml-2">{formatPrice(w.marketPrice)}</span>
                        {hasDeal && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold">DEAL</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Platform */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Platform</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(PLATFORM_LABELS) as [Platform, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedPlatform(key)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        selectedPlatform === key
                          ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                          : 'bg-[#0a0a0f] border border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Post type */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Post Type</label>
                <div className="space-y-1">
                  {(Object.entries(POST_TYPE_LABELS) as [PostType, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedType(key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        selectedType === key
                          ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                          : 'text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!selectedWatch}
                className={`w-full py-3 rounded-lg text-sm font-semibold transition ${
                  selectedWatch
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                Generate Post
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="bg-[#111118] border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Preview</h2>
                {generatedContent && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0a0a0f] border border-gray-700 hover:border-gray-600 text-gray-300 transition"
                    >
                      <CopyIcon className="w-3.5 h-3.5" />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition"
                    >
                      {saving ? <SpinnerIcon className="w-3.5 h-3.5" /> : <ShareIcon className="w-3.5 h-3.5" />}
                      Save
                    </button>
                  </div>
                )}
              </div>

              {generatedContent ? (
                <div className="bg-[#0a0a0f] border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold uppercase">
                      {PLATFORM_LABELS[selectedPlatform]}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold uppercase">
                      {POST_TYPE_LABELS[selectedType]}
                    </span>
                  </div>
                  <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                    {generatedContent}
                  </pre>
                </div>
              ) : (
                <div className="bg-[#0a0a0f] border border-gray-700 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center">
                  <MarketingIcon className="w-10 h-10 text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500">Select a watch and click Generate</p>
                  <p className="text-xs text-gray-600 mt-1">Your post preview will appear here</p>
                </div>
              )}
            </div>

            {/* Quick generate for all platforms */}
            {selectedWatch && generatedContent && (
              <div className="bg-[#111118] border border-gray-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white">Quick Copy for All Platforms</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(PLATFORM_LABELS) as [Platform, string][]).map(([key, label]) => {
                    const data = getWatchData();
                    if (!data) return null;
                    const content = generatePost(data, key, selectedType);
                    return (
                      <button
                        key={key}
                        onClick={() => handleCopy(content)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium bg-[#0a0a0f] border border-gray-700 hover:border-blue-500/30 text-gray-300 transition"
                      >
                        {label}
                        <CopyIcon className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ideas Tab */}
      {activeTab === 'ideas' && (
        <div className="space-y-3">
          {ideas.length === 0 ? (
            <div className="bg-[#111118] border border-gray-800 rounded-xl p-12 text-center">
              <HashtagIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No content ideas yet</p>
              <p className="text-xs text-gray-600 mt-1">Ideas are generated from your watch data and market trends</p>
            </div>
          ) : (
            ideas.map((idea, i) => (
              <div key={i} className="bg-[#111118] border border-gray-800 rounded-xl p-4 hover:border-blue-500/30 transition group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        idea.type === 'deal' ? 'bg-green-500/20 text-green-400' :
                        idea.type === 'pricewatch' ? 'bg-yellow-500/20 text-yellow-400' :
                        idea.type === 'spotlight' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {POST_TYPE_LABELS[idea.type]}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">{idea.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{idea.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedWatch(watches[idea.watchIndex]?.id || '');
                      setSelectedType(idea.type);
                      setActiveTab('generator');
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 transition opacity-0 group-hover:opacity-100"
                  >
                    Generate
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Saved Posts Tab */}
      {activeTab === 'saved' && (
        <div className="space-y-3">
          {savedPosts.length === 0 ? (
            <div className="bg-[#111118] border border-gray-800 rounded-xl p-12 text-center">
              <CalendarIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No saved posts yet</p>
              <p className="text-xs text-gray-600 mt-1">Generate content and save it here to track what you&apos;ve posted</p>
            </div>
          ) : (
            savedPosts.map((post) => (
              <div key={post.id} className="bg-[#111118] border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-400 uppercase">
                      {post.platform}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-400 uppercase">
                      {post.type}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      post.status === 'posted' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {post.status === 'posted' ? 'POSTED' : 'DRAFT'}
                    </span>
                    {post.brand && (
                      <span className="text-xs text-gray-500">{post.brand} {post.model}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(post.content)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition"
                      title="Copy"
                    >
                      <CopyIcon className="w-3.5 h-3.5" />
                    </button>
                    {post.status === 'draft' && (
                      <button
                        onClick={() => handleMarkPosted(post.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition"
                        title="Mark as posted"
                      >
                        <ShareIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                      title="Delete"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed bg-[#0a0a0f] border border-gray-700/50 rounded-lg p-3">
                  {post.content}
                </pre>
                <p className="text-[10px] text-gray-600 mt-2">
                  {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {post.postedAt && ` · Posted ${new Date(post.postedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
