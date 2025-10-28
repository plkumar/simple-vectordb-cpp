#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include "simple_hnsw.h"

namespace py = pybind11;

PYBIND11_MODULE(SimpleHNSW, m) {
    m.doc() = "SimpleHNSW - A simple HNSW implementation for approximate nearest neighbor search";

    py::class_<SimpleHNSWIndex>(m, "SimpleHNSWIndex")
        .def(py::init<int, double, int, int, unsigned int>(),
             py::arg("L") = 5,
             py::arg("mL") = 0.62,
             py::arg("efc") = 10,
             py::arg("maxConnections") = 16,
             py::arg("seed") = 0u,
             R"doc(
                Initialize a SimpleHNSW index.

                Args:
                    L (int): Number of layers (default: 5)
                    mL (float): Normalization factor for layer assignment (default: 0.62)
                    efc (int): Size of the dynamic candidate list during construction (default: 10)
                    maxConnections (int): Maximum number of connections per node (default: 16)
                    seed (int): RNG seed (0 => non-deterministic)
             )doc")
        .def("insert", &SimpleHNSWIndex::insert,
             py::arg("vector"),
             R"doc(
                Insert a vector into the index.

                Args:
                    vector (list[float]): The vector to insert
             )doc")
        .def("search", &SimpleHNSWIndex::search,
             py::arg("query"),
             py::arg("ef") = 1,
             R"doc(
                Search for the nearest neighbors of a query vector.

                Args:
                    query (list[float]): The query vector
                    ef (int): Size of the dynamic candidate list during search (default: 1)

                Returns:
                    list[tuple[float, int]]: List of (distance, index) pairs for nearest neighbors
             )doc")
        .def("toJSON", &SimpleHNSWIndex::toJSON,
             R"doc(
                Serialize the index to a JSON string.

                Returns:
                    str: JSON representation of the index
             )doc")
        .def_static("fromJSON", &SimpleHNSWIndex::fromJSON,
             py::arg("json"),
             R"doc(
                Deserialize an index from a JSON string.

                Args:
                    json (str): JSON representation of the index

                Returns:
                    SimpleHNSWIndex: Deserialized index
             )doc");
}
