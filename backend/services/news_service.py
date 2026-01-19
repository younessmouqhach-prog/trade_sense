import requests
import json
from datetime import datetime, timedelta
from flask import current_app
from typing import List, Dict, Optional, Any
import logging
from bs4 import BeautifulSoup
import re

logger = logging.getLogger(__name__)

class NewsService:
    """Service for fetching and managing financial news from Investing.com"""

    def __init__(self):
        self.base_url = 'https://www.investing.com'
        self.cache_ttl = current_app.config.get('NEWS_CACHE_TTL', 120)

        # Simple in-memory cache (in production, use Redis)
        self._cache = {}
        self._cache_timestamps = {}

        # Investing.com news sections
        self.news_sections = {
            'business': '/news/stock-market-news',
            'crypto': '/news/cryptocurrency-news',
            'forex': '/news/forex-news',
            'macro': '/news/economic-indicators',
            'earnings': '/news/earnings-calendar',
            'technology': '/news/technology-news'
        }

    def _is_cache_valid(self, key: str) -> bool:
        """Check if cached data is still valid"""
        if key not in self._cache_timestamps:
            return False

        cache_time = self._cache_timestamps[key]
        return (datetime.now() - cache_time).total_seconds() < self.cache_ttl

    def _get_cached_data(self, key: str) -> Optional[Any]:
        """Get data from cache if valid"""
        if self._is_cache_valid(key):
            return self._cache[key]
        return None

    def _set_cached_data(self, key: str, data: Any):
        """Store data in cache with timestamp"""
        self._cache[key] = data
        self._cache_timestamps[key] = datetime.now()

    def _scrape_investing_news(self, section: str = '', limit: int = 20) -> List[Dict]:
        """Scrape news from Investing.com"""
        try:
            if section and section in self.news_sections:
                url = f"{self.base_url}{self.news_sections[section]}"
            else:
                url = f"{self.base_url}/news"

            logger.info(f"Scraping Investing.com news from: {url}")

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }

            response = requests.get(url, headers=headers, timeout=15)
            logger.info(f"Investing.com response status: {response.status_code}")
            logger.info(f"Investing.com response content length: {len(response.content)}")

            if response.status_code != 200:
                logger.error(f"Investing.com request failed: {response.status_code}")
                logger.error(f"Response text: {response.text[:500]}")
                return []

            soup = BeautifulSoup(response.content, 'html.parser')
            logger.info(f"Parsed HTML title: {soup.title.string if soup.title else 'No title'}")
            logger.info(f"Found {len(soup.find_all('article'))} article tags")
            logger.info(f"Found {len(soup.find_all('div', class_=re.compile(r'.*(article|news|story|item).*')))} potential article containers")

            # Extract news articles
            articles = []

            # Look for news articles in different possible containers
            article_containers = soup.find_all(['article', 'div'], class_=re.compile(r'.*(article|news|story|item).*'))

            for container in article_containers[:limit]:
                try:
                    # Extract title
                    title_elem = container.find(['h1', 'h2', 'h3', 'a'], class_=re.compile(r'.*title.*')) or \
                                container.find(['h1', 'h2', 'h3', 'a'])
                    title = title_elem.get_text(strip=True) if title_elem else ""

                    if not title or len(title) < 10:
                        continue

                    # Extract link
                    link_elem = container.find('a', href=True)
                    link = link_elem['href'] if link_elem else ""
                    if link and not link.startswith('http'):
                        link = f"{self.base_url}{link}"

                    # Extract summary/description
                    summary_elem = container.find(['p', 'div'], class_=re.compile(r'.*(summary|description|excerpt).*')) or \
                                 container.find(['p', 'div'], string=True)
                    summary = summary_elem.get_text(strip=True) if summary_elem else ""

                    # Extract image
                    img_elem = container.find('img', src=True)
                    image_url = img_elem['src'] if img_elem else None
                    if image_url and not image_url.startswith('http'):
                        image_url = f"https:{image_url}" if image_url.startswith('//') else f"{self.base_url}{image_url}"

                    # Extract time
                    time_elem = container.find(['time', 'span'], class_=re.compile(r'.*time.*')) or \
                              container.find(['time', 'span'], datetime=True)
                    published_at = self._parse_time(time_elem)

                    # Determine category and symbols
                    category = self._determine_category(title + " " + summary, section)
                    symbols = self._extract_symbols_from_content(title + " " + summary)

                    # Determine impact level
                    impact_level = self._determine_impact_level(title, summary)

                    article = {
                        'id': link.split('/')[-1] if link else f"investing_{len(articles)}",
                        'title': title,
                        'summary': summary[:300] + "..." if len(summary) > 300 else summary,
                        'content': summary,
                        'url': link,
                        'source': 'Investing.com',
                        'published_at': published_at,
                        'image_url': image_url,
                        'symbols': symbols,
                        'category': category,
                        'impact_level': impact_level,
                        'is_breaking': impact_level == 'high',
                        'tags': [category, impact_level] + symbols[:3]
                    }

                    articles.append(article)

                except Exception as e:
                    logger.warning(f"Error parsing article: {e}")
                    continue

            # If we didn't find articles in the expected containers, try alternative parsing
            if len(articles) == 0:
                articles = self._fallback_parsing(soup, limit)

            logger.info(f"Successfully scraped {len(articles)} articles from Investing.com")
            return articles

        except Exception as e:
            logger.error(f"Error scraping Investing.com: {e}")
            return []

    def get_financial_news(self, symbol: Optional[str] = None, category: Optional[str] = None,
                          limit: int = 50) -> Dict[str, Any]:
        """
        Get financial news with optional filtering from Investing.com

        Args:
            symbol: Filter by specific symbol/asset (e.g., 'AAPL', 'BTC')
            category: Filter by category ('business', 'crypto', 'forex', 'macro', 'earnings', 'technology')
            limit: Maximum number of articles to return

        Returns:
            Dict with normalized news articles
        """

        # Create cache key based on parameters
        cache_key = f"news_{symbol or 'all'}_{category or 'all'}_{limit}"

        # Check cache first
        cached_data = self._get_cached_data(cache_key)
        if cached_data:
            logger.info("Returning cached news data")
            return cached_data

        # Scrape news from Investing.com
        logger.info(f"Starting news scraping for category: {category}, limit: {limit}")
        try:
            articles = self._scrape_investing_news(category or '', limit)
            logger.info(f"Scraping returned {len(articles)} articles")
        except Exception as e:
            logger.error(f"Exception during scraping: {e}")
            articles = []

        if not articles:
            # Return fallback data if scraping fails
            logger.warning("Investing.com scraping failed, returning fallback data")
            fallback_data = self._get_fallback_news()
            self._set_cached_data(cache_key, fallback_data)
            return fallback_data

        # Filter by symbol if specified
        if symbol:
            # Filter articles that mention the symbol
            symbol_upper = symbol.upper()
            filtered_articles = [
                article for article in articles
                if symbol_upper in ' '.join(article.get('symbols', [])).upper() or
                   symbol_upper in article.get('title', '').upper() or
                   symbol_upper in article.get('summary', '').upper()
            ]
            articles = filtered_articles[:limit]

        # Apply additional filtering and normalization
        normalized_articles = self._post_process_articles(articles, symbol, category)

        result = {
            'articles': normalized_articles,
            'total': len(normalized_articles),
            'symbol': symbol,
            'category': category,
            'cached': False,
            'timestamp': datetime.now().isoformat(),
            'source': 'Investing.com'
        }

        # Cache the result
        self._set_cached_data(cache_key, result)

        return result

    def _parse_time(self, time_elem) -> str:
        """Parse time from Investing.com HTML elements"""
        if not time_elem:
            return datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')

        # Try to get datetime attribute
        if hasattr(time_elem, 'get') and time_elem.get('datetime'):
            try:
                dt = datetime.fromisoformat(time_elem['datetime'].replace('Z', '+00:00'))
                return dt.strftime('%Y-%m-%d %H:%M:%S UTC')
            except:
                pass

        # Try to parse text content
        text = time_elem.get_text(strip=True) if hasattr(time_elem, 'get_text') else str(time_elem)
        text = text.lower()

        # Handle relative time formats
        if 'minute' in text or 'min' in text:
            minutes = int(re.search(r'(\d+)', text).group(1)) if re.search(r'(\d+)', text) else 0
            dt = datetime.now() - timedelta(minutes=minutes)
        elif 'hour' in text or 'hr' in text:
            hours = int(re.search(r'(\d+)', text).group(1)) if re.search(r'(\d+)', text) else 0
            dt = datetime.now() - timedelta(hours=hours)
        elif 'day' in text or 'yesterday' in text:
            days = 1 if 'yesterday' in text else (int(re.search(r'(\d+)', text).group(1)) if re.search(r'(\d+)', text) else 1)
            dt = datetime.now() - timedelta(days=days)
        else:
            dt = datetime.now()

        return dt.strftime('%Y-%m-%d %H:%M:%S UTC')

    def _determine_category(self, content: str, section: str) -> str:
        """Determine article category based on content and section"""
        content_lower = content.lower()

        # Section-based categorization
        if section == 'crypto':
            return 'crypto'
        elif section == 'forex':
            return 'forex'
        elif section == 'economic-indicators':
            return 'macro'
        elif section == 'earnings-calendar':
            return 'earnings'

        # Content-based categorization
        if any(word in content_lower for word in ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'nft']):
            return 'crypto'
        elif any(word in content_lower for word in ['forex', 'currency', 'dollar', 'euro', 'yen']):
            return 'forex'
        elif any(word in content_lower for word in ['fed', 'federal reserve', 'interest rate', 'inflation', 'economy']):
            return 'macro'
        elif any(word in content_lower for word in ['earnings', 'quarterly', 'results', 'revenue']):
            return 'earnings'
        elif any(word in content_lower for word in ['technology', 'tech', 'software', 'ai', 'artificial']):
            return 'technology'
        else:
            return 'business'

    def _extract_symbols_from_content(self, content: str) -> List[str]:
        """Extract stock/crypto symbols from article content"""
        if not content:
            return []

        # Common symbols to look for (expanded list)
        symbols = [
            'AAPL', 'TSLA', 'NVDA', 'GOOGL', 'MSFT', 'META', 'AMZN', 'NFLX',
            'BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOT', 'DOGE', 'SHIB', 'AVAX',
            'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD',
            'SPY', 'QQQ', 'IWM', 'VTI', 'VXUS', 'BND', 'VNQ',
            'XOM', 'CVX', 'COP', 'EOG', 'PXD', 'MPC', 'PSX',
            'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'DB',
            'JNJ', 'PFE', 'MRK', 'ABBV', 'BMY', 'LLY',
            'WMT', 'HD', 'COST', 'TGT', 'LOW',
            'KO', 'PEP', 'MDLZ', 'MO', 'PM'
        ]

        found_symbols = []
        content_upper = content.upper()

        for symbol in symbols:
            # Look for symbol with word boundaries
            if re.search(r'\b' + re.escape(symbol) + r'\b', content_upper):
                found_symbols.append(symbol)

        return found_symbols

    def _determine_impact_level(self, title: str, summary: str) -> str:
        """Determine impact level of news article"""
        content = (title + " " + summary).lower()

        # High impact keywords
        high_impact = [
            'breaking', 'alert', 'emergency', 'crash', 'surge', 'plunge',
            'bankruptcy', 'collapse', 'crisis', 'recession', 'bear market',
            'bull market', 'record high', 'record low', 'historic',
            'federal reserve', 'interest rate decision', 'fomc',
            'geopolitical', 'war', 'sanctions', 'trade war'
        ]

        # Medium impact keywords
        medium_impact = [
            'earnings', 'quarterly results', 'guidance', 'forecast',
            'merger', 'acquisition', 'deal', 'partnership',
            'lawsuit', 'regulation', 'sec', 'fda', 'approval',
            'upgrade', 'downgrade', 'rating change'
        ]

        if any(word in content for word in high_impact):
            return 'high'
        elif any(word in content for word in medium_impact):
            return 'medium'
        else:
            return 'normal'

    def _post_process_articles(self, articles: List[Dict], symbol: Optional[str] = None,
                             category: Optional[str] = None) -> List[Dict]:
        """Post-process and normalize scraped articles"""
        processed = []

        for article in articles:
            # Ensure all required fields are present
            processed_article = {
                'id': article.get('id', f"article_{len(processed)}"),
                'title': article.get('title', 'Untitled'),
                'summary': article.get('summary', ''),
                'content': article.get('content', article.get('summary', '')),
                'url': article.get('url', ''),
                'source': article.get('source', 'Investing.com'),
                'published_at': article.get('published_at', datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')),
                'image_url': article.get('image_url'),
                'symbols': article.get('symbols', []),
                'category': article.get('category', 'business'),
                'impact_level': article.get('impact_level', 'normal'),
                'is_breaking': article.get('impact_level') == 'high',
                'tags': article.get('tags', [])
            }

            processed.append(processed_article)

        return processed

    def _fallback_parsing(self, soup: BeautifulSoup, limit: int) -> List[Dict]:
        """Fallback parsing method if main parsing fails"""
        articles = []

        try:
            # Look for any links that might be news articles
            links = soup.find_all('a', href=re.compile(r'/news/'))

            for link in links[:limit]:
                href = link.get('href')
                if href and '/news/' in href:
                    title = link.get_text(strip=True)
                    if title and len(title) > 20:  # Likely a real article title
                        if not href.startswith('http'):
                            href = f"{self.base_url}{href}"

                        article = {
                            'id': href.split('/')[-1] if href else f"fallback_{len(articles)}",
                            'title': title,
                            'summary': f"Read the full article about {title[:50]}...",
                            'content': f"Read the full article about {title[:50]}...",
                            'url': href,
                            'source': 'Investing.com',
                            'published_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC'),
                            'image_url': None,
                            'symbols': self._extract_symbols_from_content(title),
                            'category': self._determine_category(title, ''),
                            'impact_level': 'normal',
                            'is_breaking': False,
                            'tags': ['business', 'normal']
                        }
                        articles.append(article)

        except Exception as e:
            logger.warning(f"Fallback parsing failed: {e}")

        return articles

    def _normalize_articles(self, articles: List[Dict], symbol: Optional[str] = None) -> List[Dict]:
        """Normalize NewsAPI articles to our format"""
        normalized = []

        for article in articles[:50]:  # Limit to 50 articles
            try:
                # Parse published date
                published_at = article.get('publishedAt', '')
                try:
                    # Convert to datetime for consistent formatting
                    dt = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                    formatted_date = dt.strftime('%Y-%m-%d %H:%M:%S UTC')
                except:
                    formatted_date = published_at

                # Determine impact level (simplified logic)
                title_lower = article.get('title', '').lower()
                content_lower = article.get('description', '').lower()

                impact_level = 'normal'
                if any(word in title_lower for word in ['breaking', 'alert', 'emergency', 'crash', 'surge']):
                    impact_level = 'high'
                elif any(word in title_lower for word in ['earnings', 'results', 'quarterly', 'announcement']):
                    impact_level = 'medium'

                # Extract relevant symbols/assets from content
                detected_symbols = self._extract_symbols_from_content(
                    article.get('title', '') + ' ' + article.get('description', '')
                )

                # Determine category
                category = self._categorize_article(article)

                normalized_article = {
                    'id': article.get('url', '').replace('/', '_').replace(':', '_'),  # Create ID from URL
                    'title': article.get('title', ''),
                    'summary': article.get('description', ''),
                    'content': article.get('content', ''),
                    'url': article.get('url', ''),
                    'source': article.get('source', {}).get('name', 'Unknown'),
                    'published_at': formatted_date,
                    'image_url': article.get('urlToImage'),
                    'symbols': detected_symbols,
                    'category': category,
                    'impact_level': impact_level,
                    'is_breaking': impact_level == 'high',
                    'tags': [category, impact_level] + (detected_symbols[:3] if detected_symbols else [])
                }

                normalized.append(normalized_article)

            except Exception as e:
                logger.warning(f"Error normalizing article: {e}")
                continue

        return normalized

    def _extract_symbols_from_content(self, content: str) -> List[str]:
        """Extract stock/crypto symbols from article content"""
        if not content:
            return []

        # Common symbols to look for
        symbols = [
            'AAPL', 'TSLA', 'NVDA', 'GOOGL', 'MSFT', 'META', 'AMZN', 'NFLX',
            'BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOT', 'DOGE', 'SHIB',
            'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'
        ]

        found_symbols = []
        content_upper = content.upper()

        for symbol in symbols:
            if f" {symbol} " in f" {content_upper} " or f"${symbol}" in content_upper:
                found_symbols.append(symbol)

        return found_symbols

    def _categorize_article(self, article: Dict) -> str:
        """Categorize article based on content"""
        title = article.get('title', '').lower()
        description = article.get('description', '').lower()

        content = f"{title} {description}"

        if any(word in content for word in ['crypto', 'bitcoin', 'ethereum', 'blockchain']):
            return 'crypto'
        elif any(word in content for word in ['forex', 'currency', 'dollar', 'euro', 'exchange']):
            return 'forex'
        elif any(word in content for word in ['earnings', 'quarterly', 'results', 'revenue']):
            return 'earnings'
        elif any(word in content for word in ['fed', 'federal reserve', 'interest rate', 'inflation']):
            return 'macro'
        elif any(word in content for word in ['technology', 'tech', 'software', 'ai', 'artificial']):
            return 'technology'
        else:
            return 'business'

    def _get_fallback_news(self) -> Dict[str, Any]:
        """Return fallback news data when API is unavailable"""
        fallback_articles = [
            {
                'id': 'fallback_1',
                'title': 'Market Update: Tech Stocks Show Resilience',
                'summary': 'Major technology stocks continue to demonstrate strong performance despite market volatility.',
                'content': 'Technology sector shows resilience with major players maintaining upward momentum...',
                'url': 'https://example.com/market-update',
                'source': 'TradeSense News',
                'published_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC'),
                'image_url': None,
                'symbols': ['AAPL', 'MSFT', 'NVDA'],
                'category': 'technology',
                'impact_level': 'normal',
                'is_breaking': False,
                'tags': ['technology', 'normal', 'AAPL', 'MSFT', 'NVDA']
            },
            {
                'id': 'fallback_2',
                'title': 'Cryptocurrency Market Analysis',
                'summary': 'Bitcoin and Ethereum show signs of recovery as institutional interest grows.',
                'content': 'Digital assets are gaining traction with increased institutional participation...',
                'url': 'https://example.com/crypto-analysis',
                'source': 'TradeSense News',
                'published_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC'),
                'image_url': None,
                'symbols': ['BTC', 'ETH'],
                'category': 'crypto',
                'impact_level': 'normal',
                'is_breaking': False,
                'tags': ['crypto', 'normal', 'BTC', 'ETH']
            }
        ]

        return {
            'articles': fallback_articles,
            'total': len(fallback_articles),
            'symbol': None,
            'category': None,
            'cached': False,
            'fallback': True,
            'timestamp': datetime.now().isoformat()
        }