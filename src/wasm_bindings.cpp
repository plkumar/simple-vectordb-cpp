#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "simple_hnsw.h"

using namespace emscripten;

// Helper functions
static std::vector<double> convertJSArrayToVector(const val& jsArray) {
    std::vector<double> vec;
    unsigned int length = jsArray["length"].as<unsigned int>();
    vec.reserve(length);
    for (unsigned int i = 0; i < length; ++i) {
        vec.push_back(jsArray[i].as<double>());
    }
    return vec;
}

static val convertResultsToJS(const std::vector<std::pair<Distance, NodeIndex>>& results) {
    val jsArray = val::array();
    for (size_t i = 0; i < results.size(); ++i) {
        val item = val::object();
        item.set("distance", results[i].first);
        item.set("nodeIndex", static_cast<unsigned int>(results[i].second));
        jsArray.set(i, item);
    }
    return jsArray;
}

class SimpleHNSWIndexWrapper {
private:
    SimpleHNSWIndex index;

public:
    SimpleHNSWIndexWrapper(int L = 5, double mL = 0.62, int efc = 10, int maxConnections = 16, unsigned int seed = 0u)
        : index(L, mL, efc, maxConnections, seed) {}

    void insert(const val& jsVector) {
        Vector vec = convertJSArrayToVector(jsVector);
        index.insert(vec);
    }

    val search(const val& jsQuery, int k = 5) {
        Vector query = convertJSArrayToVector(jsQuery);
        auto results = index.search(query, k);
        return convertResultsToJS(results);
    }

    std::string toJSON() {
        return index.toJSON();
    }

    static SimpleHNSWIndexWrapper fromJSON(const std::string& jsonStr) {
        SimpleHNSWIndex loadedIndex = SimpleHNSWIndex::fromJSON(jsonStr);
        SimpleHNSWIndexWrapper wrapper;
        wrapper = SimpleHNSWIndexWrapper();
        wrapper.index = std::move(loadedIndex);
        return wrapper;
    }
};

EMSCRIPTEN_BINDINGS(simple_hnsw) {
    class_<SimpleHNSWIndexWrapper>("SimpleHNSWIndex")
        .constructor<int, double, int, int, unsigned int>()
        .function("insert", &SimpleHNSWIndexWrapper::insert)
        .function("search", &SimpleHNSWIndexWrapper::search)
        .function("toJSON", &SimpleHNSWIndexWrapper::toJSON)
        .class_function("fromJSON", &SimpleHNSWIndexWrapper::fromJSON);
}
