cmake_minimum_required(VERSION 3.22.1)
project(NotesAI)

set(PACKAGE_NAME "com.notesai.app")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)

add_library(${PACKAGE_NAME} SHARED
    ${REACT_ANDROID_DIR}/jni/react/jni/react_native_jni.cpp
)

target_link_libraries(${PACKAGE_NAME}
    android
    log
)