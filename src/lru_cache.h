#ifndef LRU_CACHE_H
#define LRU_CACHE_H

#include <unordered_map>
#include <list>
#include <stdexcept>
#include <chrono>
#include <memory>
#include <vector>
#include <string>
#include <any>

// LRUCache template class
template<typename Key, typename Value>
class LRUCache {
private:
    using Timestamp = std::chrono::steady_clock::time_point;

    struct CacheItem {
        Value value;
        Timestamp timestamp;
    };

    std::list<std::pair<Key, CacheItem>> itemList;
    std::unordered_map<Key, typename decltype(itemList)::iterator> itemMap;
    size_t maxSize;
    std::chrono::milliseconds maxAge;

    void moveToFront(typename decltype(itemList)::iterator it) {
        itemList.splice(itemList.begin(), itemList, it);
    }

    void evict() {
        while (itemList.size() > maxSize || (maxAge.count() > 0 && !itemList.empty() &&
                std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now() - itemList.back().second.timestamp).count() > maxAge.count())) {
            itemMap.erase(itemList.back().first);
            itemList.pop_back();
        }
    }

public:
    LRUCache(size_t maxSize, std::chrono::milliseconds maxAge = std::chrono::milliseconds(0))
        : maxSize(maxSize), maxAge(maxAge) {}

    void put(const Key& key, const Value& value) {
        auto now = std::chrono::steady_clock::now();
        auto it = itemMap.find(key);
        if (it != itemMap.end()) {
            it->second->second.value = value;
            it->second->second.timestamp = now;
            moveToFront(it->second);
        } else {
            itemList.push_front({ key, { value, now } });
            itemMap[key] = itemList.begin();
        }
        evict();
    }

    Value get(const Key& key) {
        auto it = itemMap.find(key);
        if (it == itemMap.end()) {
            throw std::runtime_error("Key not found");
        }
        moveToFront(it->second);
        return it->second->second.value;
    }

    bool contains(const Key& key) const {
        return itemMap.find(key) != itemMap.end();
    }

    size_t size() const {
        return itemMap.size();
    }
};

// Cache singleton class
// class Cache {
// private:
//     static std::unique_ptr<LRUCache<std::string, std::vector<std::any>>> instance;

//     Cache() {}

// public:
//     static LRUCache<std::string, std::vector<std::any>>& getInstance(size_t max = 10000, std::chrono::milliseconds maxAge = std::chrono::milliseconds(1000 * 60 * 10)) {
//         if (!instance) {
//             instance = std::make_unique<LRUCache<std::string, std::vector<std::any>>>(max, maxAge);
//         }
//         return *instance;
//     }
// };

#endif // LRU_CACHE_H
