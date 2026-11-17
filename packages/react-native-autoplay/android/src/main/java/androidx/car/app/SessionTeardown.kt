package androidx.car.app

import androidx.lifecycle.Lifecycle

/**
 * Lives in androidx.car.app to reach the package-private Session.getLifecycleInternal(), the
 * registry the host drives. Its state is DESTROYED before any of its ON_DESTROY observers run, so
 * this is already true while ScreenManager.destroyAndClearScreenStack() fires the screens' onPopped,
 * whereas the public Session.getLifecycle() only receives ON_DESTROY afterwards. ScreenManager uses
 * the same check to ignore pops after teardown. If androidx renames the method this stops compiling.
 */
internal val Session.isTornDown: Boolean
    get() = lifecycleInternal.currentState == Lifecycle.State.DESTROYED
