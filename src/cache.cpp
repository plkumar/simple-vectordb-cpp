#include <memory>
#include <vector>
#include <string>
#include <chrono>
#include "lru_cache.h"

// Provide a thread-safe initialization via function-local static
class Cache {
private:
    Cache() {}

public:
    // Return a reference to a process-wide cache instance.
    // Function-local static ensures thread-safe initialization (C++11+).
    static LRUCache<std::string, std::vector<std::any>>& getInstance(size_t max = 10000, std::chrono::milliseconds maxAge = std::chrono::milliseconds(1000 * 60 * 10)) {
        static LRUCache<std::string, std::vector<std::any>> instance(max, maxAge);
        return instance;
    }
};
