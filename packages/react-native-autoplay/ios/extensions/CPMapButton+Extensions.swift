//
//  NSObject+apply.swift
//  Pods
//
//  Created by Manuel Auer on 04.10.25.
//

import CarPlay

extension CPMapButton {
    convenience init(
        image: UIImage,
        handler: @escaping (CPMapButton) -> Void
    ) {
        self.init(handler: handler)
        self.image = image
    }
}
