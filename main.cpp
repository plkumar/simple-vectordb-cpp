#include <vector>
#include <queue>
#include <cmath>
#include <set>
#include <algorithm>
#include <iostream>
#include<functional>
#include "simple_hnsw.h"

int main() {
    // Example usage of the ExperimentalHNSWIndex class
    SimpleHNSWIndex index;
    Vector vec1 = { 1.0, 2.0, 3.0 };
    Vector vec2 = { 1.0, 2.0, 3.1 };

    index.insert(vec1);
    index.insert(vec2);

    index.insert({ 1.1, 2.1, 3.0 });

    Vector query = { 1.1, 2.1, 3.1 };
    auto results = index.search(query);

    for (const auto& result : results) {
        std::cout << "Distance: " << result.first << ", NodeIndex: " << result.second << std::endl;
    }

    return 0;
}