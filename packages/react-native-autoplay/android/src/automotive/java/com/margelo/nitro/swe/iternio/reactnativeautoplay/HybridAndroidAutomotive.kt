package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.car.Car
import android.car.CarAppFocusManager
import android.car.CarAppFocusManager.OnAppFocusChangedListener
import android.car.CarAppFocusManager.OnAppFocusOwnershipCallback
import android.car.drivingstate.CarUxRestrictionsManager
import com.margelo.nitro.NitroModules
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicReference

class HybridAndroidAutomotive : HybridAndroidAutomotiveSpec() {
    private val car = Car.createCar(NitroModules.applicationContext)

    private val onAppFocusOwnershipCallback = object : OnAppFocusOwnershipCallback {
        override fun onAppFocusOwnershipGranted(appType: Int) {
            isFocusOwned.set(true)
            notifyAppFocusListeners()
        }

        override fun onAppFocusOwnershipLost(appType: Int) {
            isFocusOwned.set(false)
            notifyAppFocusListeners()
        }
    }

    private val onAppFocusChangedListener = OnAppFocusChangedListener { appType, active ->
        isFocusActive.set(active)

        val carAppFocusManager = car.getCarManager(Car.APP_FOCUS_SERVICE) as CarAppFocusManager
        // docs say we should not get an event when we receive our own app focus
        // but we still do get it. so we do a check here again if we own it or not
        val isOwned = carAppFocusManager.isOwningFocus(
            onAppFocusOwnershipCallback, appType
        )
        isFocusOwned.set(isOwned)

        notifyAppFocusListeners()
    }

    override fun registerCarUxRestrictionsListener(callback: (restrictions: ActiveCarUxRestrictions) -> Unit): () -> Unit {
        if (uxRestrictionListeners.isEmpty()) {
            val uxRestrictionManager =
                car.getCarManager(Car.CAR_UX_RESTRICTION_SERVICE) as CarUxRestrictionsManager

            uxRestrictionManager.registerListener {
                notifyUxRestrictionListeners(it.toActiveCarUxRestrictions())
            }
        }

        uxRestrictionListeners.add(callback)

        return {
            uxRestrictionListeners.remove(callback)

            if (uxRestrictionListeners.isEmpty()) {
                val uxRestrictionManager =
                    car.getCarManager(Car.CAR_UX_RESTRICTION_SERVICE) as CarUxRestrictionsManager

                uxRestrictionManager.unregisterListener()
            }
        }
    }

    override fun getCarUxRestrictions(): ActiveCarUxRestrictions {
        val uxRestrictionManager =
            car.getCarManager(Car.CAR_UX_RESTRICTION_SERVICE) as CarUxRestrictionsManager

        return uxRestrictionManager.currentCarUxRestrictions.toActiveCarUxRestrictions()
    }

    override fun registerAppFocusListener(callback: (state: AppFocusState) -> Unit): () -> Unit {
        if (appFocusListeners.isEmpty()) {
            val carAppFocusManager = car.getCarManager(Car.APP_FOCUS_SERVICE) as CarAppFocusManager

            carAppFocusManager.addFocusListener(
                onAppFocusChangedListener, CarAppFocusManager.APP_FOCUS_TYPE_NAVIGATION
            )
        }

        appFocusListeners.add(callback)

        return {
            appFocusListeners.remove(callback)

            if (appFocusListeners.isEmpty()) {
                val carAppFocusManager =
                    car.getCarManager(Car.APP_FOCUS_SERVICE) as CarAppFocusManager

                carAppFocusManager.removeFocusListener(
                    onAppFocusChangedListener, CarAppFocusManager.APP_FOCUS_TYPE_NAVIGATION
                )
            }
        }
    }

    override fun getAppFocusState(): AppFocusState {
        val carAppFocusManager = car.getCarManager(Car.APP_FOCUS_SERVICE) as CarAppFocusManager
        val isOwned = carAppFocusManager.isOwningFocus(
            onAppFocusOwnershipCallback, CarAppFocusManager.APP_FOCUS_TYPE_NAVIGATION
        )

        isFocusOwned.set(isOwned)

        return AppFocusState(isOwned, isFocusActive.get())
    }

    override fun requestAppFocus(): () -> Unit {
        val carAppFocusManager = car.getCarManager(Car.APP_FOCUS_SERVICE) as CarAppFocusManager
        carAppFocusManager.requestAppFocus(
            CarAppFocusManager.APP_FOCUS_TYPE_NAVIGATION, onAppFocusOwnershipCallback
        )

        return {
            carAppFocusManager.abandonAppFocus(
                onAppFocusOwnershipCallback, CarAppFocusManager.APP_FOCUS_TYPE_NAVIGATION
            )
        }
    }

    companion object {
        private var isFocusOwned = AtomicReference<Boolean?>(null)
        private var isFocusActive = AtomicReference<Boolean?>(null)

        private val uxRestrictionListeners =
            CopyOnWriteArrayList<(ActiveCarUxRestrictions) -> Unit>()
        private val appFocusListeners = CopyOnWriteArrayList<(AppFocusState) -> Unit>()

        private fun notifyAppFocusListeners() {
            val state = AppFocusState(isFocusOwned.get(), isFocusActive.get())

            appFocusListeners.forEach {
                it(state)
            }
        }

        private fun notifyUxRestrictionListeners(restrictions: ActiveCarUxRestrictions) {
            uxRestrictionListeners.forEach {
                it(restrictions)
            }
        }
    }

    fun android.car.drivingstate.CarUxRestrictions.toActiveCarUxRestrictions(): ActiveCarUxRestrictions {
        val restrictions = mutableListOf<CarUxRestrictions>()

        if ((activeRestrictions and android.car.drivingstate.CarUxRestrictions.UX_RESTRICTIONS_NO_DIALPAD) != 0) {
            restrictions.add(CarUxRestrictions.UX_RESTRICTIONS_NO_DIALPAD)
        }
        if ((activeRestrictions and android.car.drivingstate.CarUxRestrictions.UX_RESTRICTIONS_NO_FILTERING) != 0) {
            restrictions.add(CarUxRestrictions.UX_RESTRICTIONS_NO_FILTERING)
        }
        if ((activeRestrictions and android.car.drivingstate.CarUxRestrictions.UX_RESTRICTIONS_LIMIT_STRING_LENGTH) != 0) {
            restrictions.add(CarUxRestrictions.UX_RESTRICTIONS_LIMIT_STRING_LENGTH)
        }
        if ((activeRestrictions and android.car.drivingstate.CarUxRestrictions.UX_RESTRICTIONS_NO_KEYBOARD) != 0) {
            restrictions.add(CarUxRestrictions.UX_RESTRICTIONS_NO_KEYBOARD)
        }
        if ((activeRestrictions and android.car.drivingstate.CarUxRestrictions.UX_RESTRICTIONS_NO_VIDEO) != 0) {
            restrictions.add(CarUxRestrictions.UX_RESTRICTIONS_NO_VIDEO)
        }
        if ((activeRestrictions and android.car.drivingstate.CarUxRestrictions.UX_RESTRICTIONS_LIMIT_CONTENT) != 0) {
            restrictions.add(CarUxRestrictions.UX_RESTRICTIONS_LIMIT_CONTENT)
        }
        if ((activeRestrictions and android.car.drivingstate.CarUxRestrictions.UX_RESTRICTIONS_NO_SETUP) != 0) {
            restrictions.add(CarUxRestrictions.UX_RESTRICTIONS_NO_SETUP)
        }
        if ((activeRestrictions and android.car.drivingstate.CarUxRestrictions.UX_RESTRICTIONS_NO_TEXT_MESSAGE) != 0) {
            restrictions.add(CarUxRestrictions.UX_RESTRICTIONS_NO_TEXT_MESSAGE)
        }
        if ((activeRestrictions and android.car.drivingstate.CarUxRestrictions.UX_RESTRICTIONS_NO_VOICE_TRANSCRIPTION) != 0) {
            restrictions.add(CarUxRestrictions.UX_RESTRICTIONS_NO_VOICE_TRANSCRIPTION)
        }
        if (activeRestrictions == android.car.drivingstate.CarUxRestrictions.UX_RESTRICTIONS_FULLY_RESTRICTED) {
            restrictions.add(CarUxRestrictions.UX_RESTRICTIONS_FULLY_RESTRICTED)
        }

        return ActiveCarUxRestrictions(
            maxContentDepth = maxContentDepth.toDouble(),
            maxCumulativeContentItems = maxCumulativeContentItems.toDouble(),
            maxRestrictedStringLength = maxRestrictedStringLength.toDouble(),
            activeRestrictions = restrictions.toTypedArray()
        )
    }
}
