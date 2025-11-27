cmake_minimum_required(VERSION 4.0)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)
find_package(cmake-fetch REQUIRED PATHS node_modules/cmake-fetch)

project(fx_native C)

fetch_package("github:holepunchto/libfx#2a3408e")

add_bare_module(fx_native)

target_sources(
  ${fx_native}
  PRIVATE
    binding.c
)

target_link_libraries(
  ${fx_native}
  PRIVATE
    $<TARGET_OBJECTS:fx>
  PUBLIC
    fx
)
