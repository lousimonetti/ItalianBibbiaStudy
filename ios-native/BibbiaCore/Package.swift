// swift-tools-version:5.9
// BibbiaCore — the pure logic + course-data layer of the native iOS app.
//
// Everything in this package is UI-free Foundation Swift, ported
// function-for-function from the web app's src/utils/*.js modules, and is
// testable with `swift test` on macOS or Linux (no Xcode required).
// The app target (ios-native/App) depends on this package.

import PackageDescription

let package = Package(
    name: "BibbiaCore",
    platforms: [
        .iOS(.v16),
        .macOS(.v13),
    ],
    products: [
        .library(name: "BibbiaCore", targets: ["BibbiaCore"]),
    ],
    targets: [
        .target(
            name: "BibbiaCore",
            resources: [
                .copy("Resources/course.json"),
                .copy("Resources/common-words.json"),
            ]
        ),
        .testTarget(
            name: "BibbiaCoreTests",
            dependencies: ["BibbiaCore"],
            resources: [.copy("Fixtures")]
        ),
    ]
)
