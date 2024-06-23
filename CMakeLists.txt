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

# Add source files
add_executable(SimpleHNSW main.cpp)

# Link the nlohmann_json library
target_link_libraries(SimpleHNSW PRIVATE nlohmann_json::nlohmann_json)

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
