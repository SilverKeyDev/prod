#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <GoogleMaps/GoogleMaps.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  NSString *googleMapsApiKey = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"GMSApiKey"];
  BOOL keySet = googleMapsApiKey != nil && [googleMapsApiKey length] > 0;
  BOOL isPlaceholder = [googleMapsApiKey isEqualToString:@"YOUR_GOOGLE_MAPS_IOS_API_KEY"];
  // Valid API keys are long and typically start with "AIza"; Map IDs are short hex (e.g. 24 chars) and must not be used here.
  BOOL looksLikeApiKey = keySet && [googleMapsApiKey length] >= 20 && [googleMapsApiKey hasPrefix:@"AIza"];
  if (keySet && !isPlaceholder) {
    [GMSServices provideAPIKey:googleMapsApiKey];
  }
#if DEBUG
  if (!keySet || isPlaceholder) {
    NSLog(@"[SilverKey] GMSApiKey missing or placeholder. Set GOOGLE_MAPS_IOS_API_KEY in Client/.env or ios/.xcode.env.local (Maps SDK for iOS key from Google Cloud Console). See ios/.xcode.env.example.");
  } else if (!looksLikeApiKey) {
    NSLog(@"[SilverKey] GMSApiKey set but may be invalid (expected API key starting with AIza, length >= 20). If you see GeoServices/default.csv errors, use a real Maps SDK for iOS key, not the Cloud Map ID.");
  } else {
    NSLog(@"[SilverKey] GMSApiKey valid format (length %lu).", (unsigned long)[googleMapsApiKey length]);
  }
#endif

  self.moduleName = @"main";

  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

// Linking API
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return [super application:application openURL:url options:options] || [RCTLinkingManager application:application openURL:url options:options];
}

// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  BOOL result = [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
  return [super application:application continueUserActivity:userActivity restorationHandler:restorationHandler] || result;
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  return [super application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  return [super application:application didFailToRegisterForRemoteNotificationsWithError:error];
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  return [super application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

@end
