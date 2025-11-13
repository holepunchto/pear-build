cmake_minimum_required(VERSION 3.31)

find_package(cmake-pear REQUIRED PATHS node_modules/cmake-pear)

project(pear_appling C CXX ASM)

add_pear_appling(
  pear_appling
  ID "runtime"
  NAME "PearRuntime"
  VERSION "1.0.0"
  AUTHOR "Holepunch"
  DESCRIPTION "Pear Runtime appling"
  SPLASH "distributables/icons/splash.png"

  MACOS_SIGNING_IDENTITY "-"
  MACOS_ICON "distributables/icons/darwin/icon.png"

  WINDOWS_ICON "distributables/icons/win32/icon.png"

  LINUX_CATEGORY "Development"
  LINUX_ICON "distributables/icons/linux/icon.png"
)
