#include <vector>
#include <queue>
#include <cmath>
#include <set>
#include <algorithm>
#include <iostream>
#include<functional>
#include "simple_hnsw.h"

int main() {
    SimpleHNSWIndex index;
    Vector vec1 = { 1.0, 2.0, 3.0 };
    index.insert(vec1);
    index.insert({ 1.0, 2.0, 3.1 });
    index.insert({ 1.1, 2.1, 3.0 });

    Vector query = { 1.1, 2.1, 3.1 };
    auto results = index.search(query);

    for (const auto& result : results) {
        std::cout << "Distance: " << result.first << ", NodeIndex: " << result.second << std::endl;
    }

    std::cout << "JSON :: \n\n"<<index.toJSON() << std::endl;    

    try {
        SimpleHNSWIndex hnswIndex = SimpleHNSWIndex::fromJSON(index.toJSON());
        std::cout << "HNSW Index created successfully from JSON!" << std::endl;
        // You can add more tests to validate the content of hnswIndex
        auto results2 = hnswIndex.search({ 1.1, 2.1, 3.1 });
        for (const auto& result : results2) {
            std::cout << "Distance: " << result.first << ", NodeIndex: " << result.second << std::endl;
        }
    } catch (const std::exception& e) {
        std::cerr << "Error creating HNSW Index from JSON: " << e.what() << std::endl;
    }

    return 0;
}