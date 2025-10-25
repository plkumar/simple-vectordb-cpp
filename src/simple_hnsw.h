#ifndef SIMPLE_HNSW_H
#define SIMPLE_HNSW_H

#include <vector>
#include <queue>
#include <cmath>
#include <algorithm>
#include <stdexcept>
// #include <msgpack.hpp>
#include <nlohmann/json.hpp>
#include "not_implemented_exception.h"

using namespace std;
using json = nlohmann::json;

using Vector = std::vector<double>;
using Distance = double;
using NodeIndex = unsigned long;

struct LayerNode {
    Vector vector;
    std::vector<NodeIndex> connections;
    NodeIndex layerBelow;
};

using Layer = std::vector<LayerNode>;

double EuclideanDistance(const Vector& a, const Vector& b) {
    if (a.size() != b.size()) {
        throw std::invalid_argument("Vectors must have the same length");
    }

    double sum = 0.0;
    for (size_t i = 0; i < a.size(); ++i) {
        double diff = a[i] - b[i];
        sum += diff * diff;
    }
    return std::sqrt(sum);
}

int getInsertLayer(int L, double mL) {
    return std::min(static_cast<int>(-std::floor(std::log(std::rand() / static_cast<double>(RAND_MAX)) * mL)), L - 1);
}

std::vector<std::pair<Distance, NodeIndex>> _searchLayer(
    const Layer& graph, NodeIndex entry, const Vector& query, int ef) {
    if (entry < 0 || entry >= graph.size()) {
        throw std::invalid_argument("Invalid entry index");
    }

    if (ef <= 0) {
        return {};
    }

    const LayerNode& graphEntry = graph[entry];
    Distance entryDist = EuclideanDistance(graphEntry.vector, query);
    std::vector<char> visited(graph.size(), false);
    visited[entry] = true;

    auto maxHeapComp = [](const std::pair<Distance, NodeIndex>& lhs, const std::pair<Distance, NodeIndex>& rhs) {
        return lhs.first < rhs.first;
    };

    std::vector<std::pair<Distance, NodeIndex>> best;
    best.reserve(static_cast<size_t>(ef));

    auto emplaceBest = [&](const std::pair<Distance, NodeIndex>& candidate) {
        if (best.size() < static_cast<size_t>(ef)) {
            best.push_back(candidate);
            std::push_heap(best.begin(), best.end(), maxHeapComp);
        } else if (candidate.first < best.front().first) {
            std::pop_heap(best.begin(), best.end(), maxHeapComp);
            best.back() = candidate;
            std::push_heap(best.begin(), best.end(), maxHeapComp);
        }
    };

    emplaceBest({ entryDist, entry });

    auto minHeapComp = [](const std::pair<Distance, NodeIndex>& lhs, const std::pair<Distance, NodeIndex>& rhs) {
        return lhs.first > rhs.first;
    };
    std::priority_queue<
        std::pair<Distance, NodeIndex>,
        std::vector<std::pair<Distance, NodeIndex>>,
        decltype(minHeapComp)> candidates(minHeapComp);

    candidates.emplace(entryDist, entry);

    while (!candidates.empty()) {
        auto current = candidates.top();
        candidates.pop();

        if (!best.empty() && current.first > best.front().first) {
            continue;
        }

        const LayerNode& graphCurrent = graph[current.second];
        for (NodeIndex neighbor : graphCurrent.connections) {
            if (neighbor >= graph.size()) {
                continue;
            }
            if (visited[neighbor]) {
                continue;
            }
            visited[neighbor] = true;

            const LayerNode& graphNeighbor = graph[neighbor];
            Distance dist = EuclideanDistance(graphNeighbor.vector, query);

            if (best.size() < static_cast<size_t>(ef) || dist < best.front().first) {
                candidates.emplace(dist, neighbor);
                emplaceBest({ dist, neighbor });
            }
        }
    }

    std::sort(best.begin(), best.end(), [](const auto& lhs, const auto& rhs) {
        return lhs.first < rhs.first;
    });
    return best;
}

class SimpleHNSWIndex {
private:
    int L;
    double mL;
    int efc;
    int maxConnections;
    std::vector<Layer> index;

    static bool containsConnection(const LayerNode& node, NodeIndex target) {
        return std::find(node.connections.begin(), node.connections.end(), target) != node.connections.end();
    }

    void pruneNodeConnections(Layer& layer, NodeIndex nodeIndex) {
        if (nodeIndex >= layer.size()) {
            return;
        }

        LayerNode& node = layer[nodeIndex];
        if (node.connections.empty()) {
            return;
        }

        std::vector<std::pair<Distance, NodeIndex>> scored;
        scored.reserve(node.connections.size());
        for (NodeIndex connection : node.connections) {
            if (connection == nodeIndex || connection >= layer.size()) {
                continue;
            }
            const LayerNode& neighbor = layer[connection];
            scored.emplace_back(EuclideanDistance(node.vector, neighbor.vector), connection);
        }

        if (scored.empty()) {
            node.connections.clear();
            return;
        }

        size_t target = static_cast<size_t>(maxConnections);
        if (scored.size() > target) {
            using ScoreDifferenceType = std::vector<std::pair<Distance, NodeIndex>>::difference_type;
            auto nth = scored.begin() + static_cast<ScoreDifferenceType>(target);
            std::nth_element(
                scored.begin(),
                nth,
                scored.end(),
                [](const auto& lhs, const auto& rhs) { return lhs.first < rhs.first; });
            scored.resize(target);
        }

        std::sort(scored.begin(), scored.end(), [](const auto& lhs, const auto& rhs) {
            return lhs.first < rhs.first;
        });

        node.connections.clear();
        node.connections.reserve(scored.size());
        for (const auto& entry : scored) {
            if (!containsConnection(node, entry.second)) {
                node.connections.push_back(entry.second);
            }
        }
    }

public:
    SimpleHNSWIndex(int L = 5, double mL = 0.62, int efc = 10, int maxConnectionsPerLayer = 16)
        : L(L),
          mL(mL),
          efc(efc),
          maxConnections(std::max(1, maxConnectionsPerLayer)),
          index(L) {}

    void setIndex(const std::vector<Layer>& index) {
        this->index = index;
        for (auto& layer : this->index) {
            for (size_t i = 0; i < layer.size(); ++i) {
                pruneNodeConnections(layer, static_cast<NodeIndex>(i));
            }
        }
    }

    void insert(const Vector& vec) {
        int l = getInsertLayer(L, mL);
        int startV = 0;

        for (int n = 0; n < L; ++n) {
            Layer& graph = index[n];

            if (graph.empty()) {
                graph.push_back({ vec, {}, n < L - 1 ? static_cast<NodeIndex>(index[n + 1].size()) : static_cast<NodeIndex>(-1) });
                continue;
            }

            if (n < l) {
                auto searchLayerResult = _searchLayer(graph, startV, vec, 1);
                startV = searchLayerResult[0].second;
            } else {
                LayerNode node = { vec, {}, n < L - 1 ? static_cast<NodeIndex>(index[n + 1].size()) : static_cast<NodeIndex>(-1) };
                auto nns = _searchLayer(graph, startV, vec, efc);
                std::vector<NodeIndex> selectedNeighbors;
                selectedNeighbors.reserve(std::min(static_cast<size_t>(maxConnections), nns.size()));
                for (const auto& nn : nns) {
                    if (selectedNeighbors.size() >= static_cast<size_t>(maxConnections)) {
                        break;
                    }
                    selectedNeighbors.push_back(nn.second);
                }
                node.connections = selectedNeighbors;

                NodeIndex newIndex = static_cast<NodeIndex>(graph.size());
                graph.push_back(node);
                pruneNodeConnections(graph, newIndex);

                for (NodeIndex neighborIndex : selectedNeighbors) {
                    if (neighborIndex >= graph.size()) {
                        continue;
                    }
                    LayerNode& neighborNode = graph[neighborIndex];
                    if (!containsConnection(neighborNode, newIndex)) {
                        neighborNode.connections.push_back(newIndex);
                    }
                    pruneNodeConnections(graph, neighborIndex);
                    if (!containsConnection(neighborNode, newIndex)) {
                        auto& newConnections = graph[newIndex].connections;
                        newConnections.erase(std::remove(newConnections.begin(), newConnections.end(), neighborIndex), newConnections.end());
                    }
                }
                pruneNodeConnections(graph, newIndex);
                startV = graph[startV].layerBelow;
            }
        }
    }

    std::vector<std::pair<Distance, NodeIndex>> search(const Vector& query, int ef = 1) {
        if (index[0].empty()) {
            return {};
        }

        int bestV = 0;
        for (const auto& graph : index) {
            auto searchLayer = _searchLayer(graph, bestV, query, ef);
            bestV = searchLayer[0].second;
            if (graph[bestV].layerBelow == -1) {
                return _searchLayer(graph, bestV, query, ef);
            }
            bestV = graph[bestV].layerBelow;
        }
        return {};
    }

    std::string toJSON() const {
        json jsonData;
        jsonData["L"] = L;
        jsonData["mL"] = mL;
        jsonData["efc"] = efc;
        jsonData["maxConnections"] = maxConnections;

        for (const auto& layer : index) {
            json layerData;
            for (const auto& node : layer) {
                json nodeData;
                nodeData["vector"] = node.vector;
                nodeData["connections"] = node.connections;
                nodeData["layerBelow"] = node.layerBelow;
                layerData.push_back(nodeData);
            }
            jsonData["index"].push_back(layerData);
        }

        return jsonData.dump();
    }

    static SimpleHNSWIndex fromJSON(const std::string& json) {
        auto jsonData = json::parse(json);

        int L = jsonData["L"];
        double mL = jsonData["mL"];
        int efc = jsonData["efc"];
        int maxConnections = jsonData.value("maxConnections", 16);
        std::vector<std::vector<LayerNode>> index(L);

        for (int i = 0; i < L; ++i) {
            for (const auto& nodeData : jsonData["index"][i]) {
                LayerNode node;
                node.vector = nodeData["vector"].get<std::vector<double>>();
                node.connections = nodeData["connections"].get<std::vector<unsigned long>>();
                node.layerBelow = nodeData["layerBelow"];
                index[i].push_back(node);
            }
        }

        SimpleHNSWIndex hnsw(L, mL, efc, maxConnections);
        hnsw.setIndex(index);
        return hnsw;
    }

    std::vector<uint8_t> toBinary() const {
        throw NotImplementedException("Binary serialization is not implemented yet.");
    }

    static SimpleHNSWIndex fromBinary(const std::vector<uint8_t>& binary) {
        throw NotImplementedException("Binary deserialization is not implemented yet.");
    }
};

#endif //SIMPLE_HNSW_H
