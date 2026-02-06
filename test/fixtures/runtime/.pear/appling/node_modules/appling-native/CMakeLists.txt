cmake_minimum_required(VERSION 4.0)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)
find_package(cmake-fetch REQUIRED PATHS node_modules/cmake-fetch)

project(appling_native C)

fetch_package("github:holepunchto/libappling#765ee79")
fetch_package("github:holepunchto/libcompact#fea2e4a")
fetch_package("github:holepunchto/libpath#22577c7")

add_bare_module(appling_native)

target_sources(
  ${appling_native}
  PRIVATE
    binding.c
)

target_link_libraries(
  ${appling_native}
  PRIVATE
    $<TARGET_OBJECTS:appling>
    $<TARGET_OBJECTS:compact>
    $<TARGET_OBJECTS:path>
  PUBLIC
    appling
)
