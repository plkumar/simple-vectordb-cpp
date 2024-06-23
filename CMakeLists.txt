cmake_minimum_required(VERSION 3.10)

# Project name
project(SimpleHNSW)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Add the nlohmann_json library if not available
include(FetchContent)
FetchContent_Declare(
  json
  URL https://github.com/nlohmann/json/releases/download/v3.10.5/json.tar.xz
)
FetchContent_MakeAvailable(json)

# Add source files
add_executable(SimpleHNSW main.cpp)

# Link the nlohmann_json library
target_link_libraries(SimpleHNSW PRIVATE nlohmann_json::nlohmann_json)
