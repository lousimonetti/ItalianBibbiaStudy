import AVFoundation
import BibbiaCore

// The lesson player's answer sounds. The notes come from BibbiaCore's
// LessonSound (the same table the web app plays), rendered once into small
// in-memory WAV files; nothing is bundled. The switch is stored under the same
// `sound` key, with the same "on" / "off" values, as the web app.

@MainActor
enum SoundEffects {
    private static var players: [LessonSound: AVAudioPlayer] = [:]

    static var isOn: Bool {
        get { WebStore.loadString("sound") != "off" }
        set { WebStore.saveString("sound", newValue ? "on" : "off") }
    }

    static func play(_ sound: LessonSound) {
        guard isOn else { return }
        let player: AVAudioPlayer
        if let cached = players[sound] {
            player = cached
        } else {
            // Sound is an enhancement: if the player cannot be made, stay silent.
            guard let made = try? AVAudioPlayer(data: sound.wavData(), fileTypeHint: AVFileType.wav.rawValue) else { return }
            made.volume = 0.5
            made.prepareToPlay()
            players[sound] = made
            player = made
        }
        player.currentTime = 0
        player.play()
    }
}
