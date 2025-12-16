import { useState, useEffect } from 'react';
import { shoppingAPI } from '../services/api';
import { ShoppingCart, Plus, Check, X, Trash2, CheckCircle } from 'lucide-react';

const ShoppingList = () => {
  const [shoppingList, setShoppingList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add item state
  const [newItem, setNewItem] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [adding, setAdding] = useState(false);

  // Load shopping list
  useEffect(() => {
    loadShoppingList();
  }, []);

  const loadShoppingList = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await shoppingAPI.getShoppingList();
      setShoppingList(response.data.data.shoppingList);
    } catch (err) {
      setError('Failed to load shopping list');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add new item
  const handleAddItem = async (e) => {
    e.preventDefault();

    if (!newItem.trim()) return;

    setAdding(true);
    setError('');

    try {
      await shoppingAPI.addItems({
        items: [
          {
            ingredient: newItem.trim(),
            quantity: newQuantity.trim(),
          },
        ],
      });

      // Clear inputs
      setNewItem('');
      setNewQuantity('');

      // Reload list
      await loadShoppingList();
    } catch (err) {
      setError('Failed to add item');
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  // Toggle purchased
  const handleTogglePurchased = async (itemId, currentStatus) => {
    try {
      await shoppingAPI.updateItem(itemId, {
        isPurchased: !currentStatus,
      });

      // Update local state
      setShoppingList({
        ...shoppingList,
        items: shoppingList.items.map((item) =>
          item._id === itemId
            ? { ...item, isPurchased: !currentStatus }
            : item
        ),
      });
    } catch (err) {
      console.error('Failed to toggle item:', err);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId) => {
    try {
      await shoppingAPI.deleteItem(itemId);

      // Update local state
      setShoppingList({
        ...shoppingList,
        items: shoppingList.items.filter((item) => item._id !== itemId),
      });
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  // Clear purchased items
  const handleClearPurchased = async () => {
    if (!window.confirm('Remove all purchased items from the list?')) {
      return;
    }

    try {
      await shoppingAPI.clearPurchased();
      await loadShoppingList();
    } catch (err) {
      console.error('Failed to clear purchased:', err);
    }
  };

  // Clear all items
  const handleClearAll = async () => {
    if (!window.confirm('Clear entire shopping list?')) {
      return;
    }

    try {
      await shoppingAPI.clearAll();
      await loadShoppingList();
    } catch (err) {
      console.error('Failed to clear all:', err);
    }
  };

  // Calculate counts
  const totalItems = shoppingList?.items?.length || 0;
  const purchasedCount = shoppingList?.items?.filter((item) => item.isPurchased).length || 0;
  const remainingCount = totalItems - purchasedCount;

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <ShoppingCart className="text-primary-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Shopping List</h1>
          </div>
          <p className="text-gray-600">
            Keep track of ingredients you need to buy
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Stats */}
        {!loading && shoppingList && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card text-center">
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              <p className="text-sm text-gray-600">Total Items</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-green-600">{purchasedCount}</p>
              <p className="text-sm text-gray-600">Purchased</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-orange-600">{remainingCount}</p>
              <p className="text-sm text-gray-600">Remaining</p>
            </div>
          </div>
        )}

        {/* Add Item Form */}
        <div className="card mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Item</h3>
          <form onSubmit={handleAddItem} className="flex space-x-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="e.g., milk, eggs, bread"
              className="input flex-1"
              disabled={adding}
            />
            <input
              type="text"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              placeholder="Quantity (optional)"
              className="input w-40"
              disabled={adding}
            />
            <button
              type="submit"
              disabled={adding || !newItem.trim()}
              className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
              <span>{adding ? 'Adding...' : 'Add'}</span>
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Shopping List Items */}
        {!loading && shoppingList && shoppingList.items.length > 0 && (
          <>
            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 mb-4">
              {purchasedCount > 0 && (
                <button
                  onClick={handleClearPurchased}
                  className="btn btn-secondary text-sm flex items-center space-x-1"
                >
                  <CheckCircle size={16} />
                  <span>Clear Purchased</span>
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="btn btn-secondary text-sm text-red-600 flex items-center space-x-1"
              >
                <Trash2 size={16} />
                <span>Clear All</span>
              </button>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {shoppingList.items.map((item) => (
                <div
                  key={item._id}
                  className={`card flex items-center space-x-4 ${
                    item.isPurchased ? 'bg-gray-50' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleTogglePurchased(item._id, item.isPurchased)}
                    className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      item.isPurchased
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 hover:border-primary-500'
                    }`}
                  >
                    {item.isPurchased && <Check className="text-white" size={16} />}
                  </button>

                  {/* Item Info */}
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        item.isPurchased
                          ? 'text-gray-500 line-through'
                          : 'text-gray-900'
                      }`}
                    >
                      {item.ingredient}
                    </p>
                    {item.quantity && (
                      <p className="text-sm text-gray-600">{item.quantity}</p>
                    )}
                    {item.relatedRecipe && (
                      <p className="text-xs text-primary-600 mt-1">
                        For: {item.relatedRecipe}
                      </p>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteItem(item._id)}
                    className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && shoppingList && shoppingList.items.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Your shopping list is empty
            </h3>
            <p className="text-gray-600 mb-6">
              Add items manually or generate recipes with missing ingredients
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingList;
