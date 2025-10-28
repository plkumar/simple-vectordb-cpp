#ifndef LRU_CACHE_H
#define LRU_CACHE_H

#include <unordered_map>
#include <list>
#include <chrono>
#include <mutex>
#include <optional>
#include <stdexcept>
#include <utility>
#include <algorithm>

template<typename Key, typename Value>
class LRUCache {
public:
    using Clock = std::chrono::steady_clock;
    using Timestamp = Clock::time_point;

    LRUCache(size_t maxSize, std::chrono::milliseconds maxAge = std::chrono::milliseconds(0))
        : maxSize_(std::max<size_t>(1, maxSize)), maxAge_(maxAge) {}

    // Put (copy)
    void put(const Key& key, const Value& value) {
        put_impl(key, value);
    }

    // Put (move)
    void put(Key&& key, Value&& value) {
        put_impl(std::move(key), std::move(value));
    }

    // Get: returns optional<Value> to avoid throwing for missing keys
    std::optional<Value> get(const Key& key) {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = map_.find(key);
        if (it == map_.end()) return std::nullopt;
        // move node to front
        item_list_.splice(item_list_.begin(), item_list_, it->second);
        it->second->second.timestamp = Clock::now();
        return it->second->second.value;
    }

    bool contains(const Key& key) const {
        std::lock_guard<std::mutex> lock(mutex_);
        return map_.find(key) != map_.end();
    }

    size_t size() const {
        std::lock_guard<std::mutex> lock(mutex_);
        return map_.size();
    }

    void clear() {
        std::lock_guard<std::mutex> lock(mutex_);
        item_list_.clear();
        map_.clear();
    }

private:
    struct CacheItem {
        Value value;
        Timestamp timestamp;
    };

    using ListIt = typename std::list<std::pair<Key, CacheItem>>::iterator;

    template<typename K, typename V>
    void put_impl(K&& key, V&& value) {
        std::lock_guard<std::mutex> lock(mutex_);
        auto now = Clock::now();
        auto it = map_.find(key);
        if (it != map_.end()) {
            // Update existing
            it->second->second.value = std::forward<V>(value);
            it->second->second.timestamp = now;
            item_list_.splice(item_list_.begin(), item_list_, it->second);
        } else {
            // Insert new
            item_list_.emplace_front(std::forward<K>(key), CacheItem{ std::forward<V>(value), now });
            map_[item_list_.begin()->first] = item_list_.begin();
            evict_if_needed();
        }
    }

    void evict_if_needed() {
        while (item_list_.size() > maxSize_ ||
               (maxAge_.count() > 0 && !item_list_.empty() &&
                std::chrono::duration_cast<std::chrono::milliseconds>(Clock::now() - item_list_.back().second.timestamp) > maxAge_)) {
            map_.erase(item_list_.back().first);
            item_list_.pop_back();
        }
    }

    mutable std::mutex mutex_;
    std::list<std::pair<Key, CacheItem>> item_list_;
    std::unordered_map<Key, ListIt> map_;
    size_t maxSize_;
    std::chrono::milliseconds maxAge_;
};

#endif // LRU_CACHE_H
