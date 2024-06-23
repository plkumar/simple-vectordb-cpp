cmake_minimum_required(VERSION 3.10)

# Project name
project(SimpleHNSW)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Specify Emscripten toolchain file
if(EMSCRIPTEN)
    set(CMAKE_TOOLCHAIN_FILE "${EMSCRIPTEN}/cmake/Modules/Platform/Emscripten.cmake")
endif()

# Add the nlohmann_json library if not available
include(FetchContent)
FetchContent_Declare(
  json
  URL https://github.com/nlohmann/json/releases/download/v3.11.3/json.tar.xz
)
FetchContent_MakeAvailable(json)

if (PYTHON_BINDINGS)
# Add pybind11
FetchContent_Declare(
  pybind11
  GIT_REPOSITORY https://github.com/pybind/pybind11.git
  GIT_TAG v2.12.0
)
FetchContent_MakeAvailable(pybind11)
endif()

if(!EMSCRIPTEN AND !PYTHON_BINDINGS)
# Add source files
add_executable(SimpleHNSW main.cpp)

# Link the nlohmann_json library
target_link_libraries(SimpleHNSW PRIVATE nlohmann_json::nlohmann_json)
endif()

if(PYTHON_BINDINGS)
# Add the bindings
pybind11_add_module(SimpleHNSW MODULE bindings.cpp)

# Link libraries to the bindings module
target_link_libraries(SimpleHNSW PRIVATE nlohmann_json::nlohmann_json)
endif()

# Set target properties for WebAssembly
if(EMSCRIPTEN)
    set_target_properties(SimpleHNSW PROPERTIES
        OUTPUT_NAME "SimpleHNSW"
        SUFFIX ".html"
    )

    # Additional Emscripten linker flags
    set_target_properties(SimpleHNSW PROPERTIES
        # LINK_FLAGS "--bind -sENVIRONMENT=web -sMODULARIZE=1 -sEXPORT_NAME=SimpleHNSW"
        LINK_FLAGS "--bind -sENVIRONMENT=web"
    )
endif()
