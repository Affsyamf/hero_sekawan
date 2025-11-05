import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "../../../utils/cn";
import { searchProduct } from "../../../services/product_service";

export default function ProductFilter({ value = [], onChange }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await searchProduct({ q: search, page: 1, page_size: 100 });
        setProducts(res.data.data || []);
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search]);

  const toggle = (id) => {
    const newSelected = value.includes(id)
      ? value.filter((v) => v !== id)
      : [...value, id];
    onChange(newSelected);
  };

  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-3">Products</h3>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-3 py-2 w-full text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* List */}
      <div
        className={cn(
          "border rounded-lg divide-y max-h-64 overflow-y-auto bg-gray-50",
          loading && "opacity-60"
        )}
      >
        {products.length === 0 && !loading ? (
          <div className="p-3 text-sm text-gray-500 italic">
            No products found
          </div>
        ) : (
          products.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2 p-2.5 text-sm cursor-pointer hover:bg-gray-100"
            >
              <input
                type="checkbox"
                checked={value.includes(p.id)}
                onChange={() => toggle(p.id)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-gray-700 truncate">{p.name}</span>
            </label>
          ))
        )}
      </div>

      {/* Selected count */}
      {value.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          {value.length} product{value.length > 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
