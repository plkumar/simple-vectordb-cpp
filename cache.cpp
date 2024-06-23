#include <memory>
#include <vector>
#include <string>
#include <chrono>
#include "lru_cache.h"

class Cache {
private:
    static std::unique_ptr<LRUCache<std::string, std::vector<std::any>>> instance;

    Cache() {}

public:
    static LRUCache<std::string, std::vector<std::any>>& getInstance(size_t max = 10000, std::chrono::milliseconds maxAge = std::chrono::milliseconds(1000 * 60 * 10)) {
        if (!instance) {
            instance = std::make_unique<LRUCache<std::string, std::vector<std::any>>>(max, maxAge);
        }
        return *instance;
    }
};

// Initialize the static member
std::unique_ptr<LRUCache<std::string, std::vector<std::any>>> Cache::instance = nullptr;


