#include <jni.h>
#include "ReactNativeAutoPlayOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::swe::iternio::reactnativeautoplay::initialize(vm);
}
