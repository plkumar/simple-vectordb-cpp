#include <vector>
#include <queue>
#include <cmath>
#include <set>
#include <algorithm>
#include <iostream>
#include<functional>
#include "simple_hnsw.h"
#include <chrono>

int main() {
    SimpleHNSWIndex index;
    Vector vec1 = { 1.0, 2.0, 3.0 };
    index.insert(vec1);
    index.insert({ 1.0, 2.0, 3.1 });
    index.insert({ 1.1, 2.1, 3.0 });

    Vector query = { 1.1, 2.1, 3.1 };

    

    using std::chrono::high_resolution_clock;
    using std::chrono::duration_cast;
    using std::chrono::duration;
    using std::chrono::milliseconds;

    auto t1 = high_resolution_clock::now();
    auto results = index.search(query);
    auto t2 = high_resolution_clock::now();

    /* Getting number of milliseconds as an integer. */
    auto ms_int = duration_cast<milliseconds>(t2 - t1);

    /* Getting number of milliseconds as a double. */
    duration<double, std::milli> ms_double = t2 - t1;

    std::cout << ms_int.count() << "ms\n";
    std::cout << ms_double.count() << "ms\n";

    for (const auto& result : results) {
        std::cout << "Distance: " << result.first << ", NodeIndex: " << result.second << std::endl;
    }

    std::cout << "JSON :: \n\n"<<index.toJSON() << std::endl;    

    try {
        SimpleHNSWIndex hnswIndex = SimpleHNSWIndex::fromJSON(index.toJSON());
        std::cout << "HNSW Index created successfully from JSON!" << std::endl;
        // You can add more tests to validate the content of hnswIndex
        auto results2 = hnswIndex.search({ 1.1, 2.1, 3.1 },2);
        for (const auto& result : results2) {
            std::cout << "Distance: " << result.first << ", NodeIndex: " << result.second << std::endl;
        }
    } catch (const std::exception& e) {
        std::cerr << "Error creating HNSW Index from JSON: " << e.what() << std::endl;
    }

    return 0;
}