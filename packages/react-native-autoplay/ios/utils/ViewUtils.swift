//
//  RootViewProvider.swift
//  Pods
//
//  Created by Manuel Auer on 01.10.25.
//

class ViewUtils {
    /// The React root view is opaque by default, it has to be transparent for the backdrop to show
    /// wherever the React tree does not draw.
    static func stack(reactView: UIView, onTopOf backdrop: UIView) -> UIView {
        let container = UIView()
        for view in [backdrop, reactView] {
            /// a view the host hands out more than once is still attached to the previous container
            view.removeFromSuperview()
            view.frame = container.bounds
            view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            container.addSubview(view)
        }
        reactView.backgroundColor = .clear
        return container
    }

    static func showLaunchScreen(window: UIWindow) {
        if let name = Bundle.main.object(
            forInfoDictionaryKey: "UILaunchStoryboardName"
        ) as? String,
            Bundle.main.path(forResource: name, ofType: "storyboardc")
                != nil
        {
            let storyboard = UIStoryboard(name: name, bundle: nil)
            window.rootViewController =
                storyboard.instantiateInitialViewController()
            window.makeKeyAndVisible()
        }
    }
}
