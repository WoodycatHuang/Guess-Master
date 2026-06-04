import AppKit
import Foundation

let emoji = "😀"
let renderSize: CGFloat = 72
let grid = 16
let outputSize = 128
let outDir = CommandLine.arguments.count > 1
    ? CommandLine.arguments[1]
    : FileManager.default.currentDirectoryPath

func drawEmoji(size: CGFloat) -> NSImage {
    let image = NSImage(size: NSSize(width: size, height: size))
    image.lockFocus()
    NSColor.clear.setFill()
    NSRect(x: 0, y: 0, width: size, height: size).fill()

    let font = NSFont.systemFont(ofSize: size * 0.82)
    let attrs: [NSAttributedString.Key: Any] = [.font: font]
    let str = NSAttributedString(string: emoji, attributes: attrs)
    let textSize = str.size()
    let point = NSPoint(
        x: (size - textSize.width) / 2,
        y: (size - textSize.height) / 2
    )
    str.draw(at: point)
    image.unlockFocus()
    return image
}

func cgImage(from image: NSImage) -> CGImage? {
    var rect = CGRect(origin: .zero, size: image.size)
    return image.cgImage(forProposedRect: &rect, context: nil, hints: nil)
}

func pixelate(_ source: CGImage, grid: Int, output: Int) -> CGImage? {
    let w = grid
    let h = grid
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard
        let tinyCtx = CGContext(
            data: nil,
            width: w,
            height: h,
            bitsPerComponent: 8,
            bytesPerRow: w * 4,
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ),
        let outCtx = CGContext(
            data: nil,
            width: output,
            height: output,
            bitsPerComponent: 8,
            bytesPerRow: output * 4,
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        )
    else { return nil }

    tinyCtx.interpolationQuality = .none
    tinyCtx.draw(source, in: CGRect(x: 0, y: 0, width: w, height: h))
    guard let tiny = tinyCtx.makeImage() else { return nil }

    outCtx.interpolationQuality = .none
    outCtx.draw(tiny, in: CGRect(x: 0, y: 0, width: output, height: output))
    return outCtx.makeImage()
}

func savePNG(_ cg: CGImage, path: String) {
    let url = URL(fileURLWithPath: path)
    let rep = NSBitmapImageRep(cgImage: cg)
    guard let data = rep.representation(using: .png, properties: [:]) else { return }
    try? data.write(to: url)
}

let base = drawEmoji(size: renderSize)
guard let baseCG = cgImage(from: base) else {
    fputs("Failed to render emoji\n", stderr)
    exit(1)
}

guard let pixelCG = pixelate(baseCG, grid: grid, output: outputSize) else {
    fputs("Failed to pixelate\n", stderr)
    exit(1)
}

let dir = (outDir as NSString).appendingPathComponent("assets/avatars-draft")
try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)

// 黑底版
let blackCtx = CGContext(
    data: nil,
    width: outputSize,
    height: outputSize,
    bitsPerComponent: 8,
    bytesPerRow: outputSize * 4,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
)!
blackCtx.setFillColor(CGColor(red: 0, green: 0, blue: 0, alpha: 1))
blackCtx.fill(CGRect(x: 0, y: 0, width: outputSize, height: outputSize))
blackCtx.interpolationQuality = .none
blackCtx.draw(pixelCG, in: CGRect(x: 0, y: 0, width: outputSize, height: outputSize))
if let out = blackCtx.makeImage() {
    savePNG(out, path: (dir as NSString).appendingPathComponent("emoji-pixelized-sample.png"))
}

// App 格子预览 92x92
let cell = 92
let previewCtx = CGContext(
    data: nil,
    width: cell,
    height: cell,
    bitsPerComponent: 8,
    bytesPerRow: cell * 4,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
)!
previewCtx.setFillColor(CGColor(red: 13/255, green: 14/255, blue: 21/255, alpha: 1))
previewCtx.fill(CGRect(x: 0, y: 0, width: cell, height: cell))
previewCtx.setFillColor(CGColor(red: 26/255, green: 27/255, blue: 38/255, alpha: 1))
previewCtx.fill(CGRect(x: 16, y: 16, width: 60, height: 60))
previewCtx.interpolationQuality = .none
previewCtx.draw(pixelCG, in: CGRect(x: 22, y: 22, width: 48, height: 48))
if let preview = previewCtx.makeImage() {
    savePNG(preview, path: (dir as NSString).appendingPathComponent("emoji-pixelized-in-cell.png"))
}

print("Generated emoji pixelized preview for \(emoji)")
