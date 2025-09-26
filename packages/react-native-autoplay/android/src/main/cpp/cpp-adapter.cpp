#include <jni.h>
#include "NitroAutoplayOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::at::g4rb4g3::autoplay::initialize(vm);
}
