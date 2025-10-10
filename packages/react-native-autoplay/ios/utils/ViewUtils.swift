//
//  RootViewProvider.swift
//  Pods
//
//  Created by Manuel Auer on 01.10.25.
//

class ViewUtils {
    // we use reflection to find the method that provides us root views from the app delegate
    // to avoid issues when importing React_AppDelegate (glog imports break)
    // or using a common protocol on AppDelegate and react-native-autoplay (c++ interoperability not the same)
    static func getRootView(moduleName: String, initialProps: [String: Any]) -> UIView? {
        if let appDelegate = UIApplication.shared.delegate as? NSObject {
            let selector = NSSelectorFromString("getRootViewForAutoplayWithModuleName:initialProperties:")
            if appDelegate.responds(to: selector), let methodIMP = appDelegate.method(for: selector) {
                typealias Func = @convention(c) (AnyObject, Selector, NSString, NSDictionary?) -> UIView?
                let function = unsafeBitCast(methodIMP, to: Func.self)

                return function(appDelegate, selector, moduleName as NSString, initialProps as NSDictionary)
            }
        }
        
        return nil
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
