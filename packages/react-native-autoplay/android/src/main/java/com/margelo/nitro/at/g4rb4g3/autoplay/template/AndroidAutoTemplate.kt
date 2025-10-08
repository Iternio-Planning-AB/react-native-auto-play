package com.margelo.nitro.at.g4rb4g3.autoplay.template

import androidx.car.app.CarContext
import androidx.car.app.model.Template

abstract class AndroidAutoTemplate<T>(val context: CarContext, var config: T) {
    abstract fun parse(): Template
}