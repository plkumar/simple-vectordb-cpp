#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include "simple_hnsw.h"

namespace py = pybind11;

PYBIND11_MODULE(SimpleHNSW, m) {
    py::class_<SimpleHNSWIndex>(m, "SimpleHNSWIndex")
        .def(py::init<int, double, int>(), py::arg("L") = 5, py::arg("mL") = 0.62, py::arg("efc") = 10)
        .def("insert", &SimpleHNSWIndex::insert)
        .def("search", &SimpleHNSWIndex::search)
        .def("toJSON", &SimpleHNSWIndex::toJSON)
        .def_static("fromJSON", &SimpleHNSWIndex::fromJSON);
}
