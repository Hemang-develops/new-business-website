import { Star } from 'lucide-react';

export function ProductCard({ product, usd, inr, onGetStarted }) {
  // usd and inr may be undefined while loading

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="h-48 bg-gray-200 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
            <span className="text-gray-400">No image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-2">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mb-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < product.rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">
              ({product.reviewCount || 0})
            </span>
          </div>
        )}

        {/* Price display */}
        <div className="mb-4">
          <span className="text-lg font-bold text-purple-600">
            {usd != null ? `$${usd}` : '...'}
          </span>
          <span className="ml-2 text-sm text-gray-600">
            {inr != null ? `₹${inr}` : ''}
          </span>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onGetStarted}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Get started
          </button>
        </div>
      </div>
    </div>
  );
}
