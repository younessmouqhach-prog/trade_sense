from flask import Blueprint

news_bp = Blueprint('news', __name__)

@news_bp.route('/ping')
def ping():
    return {'status': 'news blueprint working'}
    """
    Get financial news with optional filtering

    Query Parameters:
    - symbol: Filter by specific asset (e.g., 'AAPL', 'BTC')
    - category: Filter by category ('business', 'crypto', 'forex', 'macro', 'earnings', 'technology')
    - limit: Maximum number of articles (default: 20, max: 50)

    Returns:
        JSON with normalized news articles
    """
    try:
        # Get query parameters
        symbol = request.args.get('symbol')
        category = request.args.get('category')
        limit_str = request.args.get('limit', '20')

        # Validate and parse limit
        try:
            limit = int(limit_str)
            if limit < 1 or limit > 50:
                limit = 20
        except ValueError:
            limit = 20

        logger.info(f"📰 NEWS ENDPOINT CALLED: symbol={symbol}, category={category}, limit={limit}")
        print(f"📰 NEWS ENDPOINT CALLED: symbol={symbol}, category={category}, limit={limit}")

        # Get user context if authenticated
        user_id = get_jwt_identity()
        if user_id:
            logger.info(f"Authenticated user {user_id} requesting news")

        # Initialize news service and fetch news
        news_service = NewsService()
        news_data = news_service.get_financial_news(
            symbol=symbol,
            category=category,
            limit=limit
        )

        # Add user context to response
        news_data['user_authenticated'] = user_id is not None
        news_data['user_id'] = user_id

        logger.info(f"Returning {news_data.get('total', 0)} news articles")

        return jsonify(news_data), 200

    except Exception as e:
        logger.error(f"Error fetching news: {e}")
        import traceback
        traceback.print_exc()

        # Return fallback response on error
        return jsonify({
            'error': 'Failed to fetch news',
            'articles': [],
            'total': 0,
            'fallback': True,
            'timestamp': 'error'
        }), 500