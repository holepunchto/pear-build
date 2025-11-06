cmake_minimum_required(VERSION 3.31)

find_package(cmake-pear REQUIRED PATHS node_modules/cmake-pear)

project(pear_appling C CXX ASM)

add_pear_appling(
  pear_appling
  ID "keet"
  NAME "PearApp"
  VERSION "1.0.0"
  AUTHOR "Holepunch"
  DESCRIPTION "Pear Desktop Example"
  SPLASH "icons/splash.png"
  MACOS_ICON "icons/darwin/icon.png"
  WINDOWS_ICON "icons/win32/icon.png"
  LINUX_ICON "icons/linux/icon.png"
)
