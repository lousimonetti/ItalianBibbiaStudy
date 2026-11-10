import XCTest
@testable import BibbiaCore

// Guided lessons (port of lessonPlan.js / lessonStore.js / reviewMix.js). The
// `lessons.json` fixture is the real JS run over the whole course, so these
// tests fail the moment the Swift plan drifts from the web's by one shuffle.

private var articles: [String] { Course.shared.locale.articles }

private struct StepFx: Decodable, Equatable {
    let id: Int
    let kind: String
    let term: String?
    let cardIt: String?
    let direction: String?
    let prompt: String?
    let options: [String]
    let answerIndex: Int?
    let answerBool: Bool?
    let pairs: [String]
    let left: [Int]
    let right: [Int]
    let before: String?
    let answerText: String?
    let after: String?
    let text: String?
    let en: String?
    let chips: [String]
    let audio: Bool
    let partial: Bool
    let ref: String?
    let title: String?
    let body: String?
    let q: String?
    let hint: String?
    let explain: String?
    let instruction: String?

    init(_ s: LessonStep) {
        id = s.id; kind = s.kind.rawValue; term = s.term; cardIt = s.card?.it
        direction = s.direction; prompt = s.prompt; options = s.options
        answerIndex = s.answerIndex; answerBool = s.answerBool
        pairs = s.pairs.map { "\($0.it)=\($0.en)" }; left = s.left; right = s.right
        before = s.before; answerText = s.answerText; after = s.after
        text = s.text; en = s.en; chips = s.chips; audio = s.audio; partial = s.partial; ref = s.ref
        title = s.title; body = s.body; q = s.q; hint = s.hint; explain = s.explain
        instruction = s.instruction
    }
}

private struct LessonFx: Decodable {
    let key: String
    let n: Int
    let kind: String
    let title: String
    let sub: String
    let words: [String]
    let minutes: Int
    let steps: [StepFx]
}

private struct Fixture: Decodable {
    struct Rng: Decodable { let seed: String; let hash: UInt32; let values: [Double]; let shuffle: [Int] }
    struct Drill: Decodable { let expected: String; let given: String; let ok: Bool }
    struct Transform: Decodable { let answer: String; let typed: String; let ok: Bool }
    struct WeekFx: Decodable { let n: Int; let lessons: [LessonFx] }
    struct Summary: Decodable { let graded: Int; let correct: Int; let pct: Int }
    struct Run: Decodable {
        let key: String
        let miss: [Int]
        let store: SRSStore
        let now: Double
        let queue: [String]
        let first: [String: Bool]
        let summary: Summary
        let grades: [String]
    }
    struct Next: Decodable {
        struct Out: Decodable { let kind: String; let key: String?; let ahead: Bool; let due: Int? }
        let done: [String]
        let currentWeekN: Int?
        let due: Int
        let out: Out
    }
    struct Mix: Decodable { let it: String; let reps: Int?; let relearn: Int?; let hasState: Bool; let style: String }

    let rng: [Rng]
    let drill: [Drill]
    let transform: [Transform]
    let weeks: [WeekFx]
    let runs: [Run]
    let next: [Next]
    let mix: [Mix]
}

final class LessonsFixtureTests: XCTestCase {
    private static let fixture = Result { try loadFixture("lessons", as: Fixture.self) }
    private var fx: Fixture { get throws { try Self.fixture.get() } }

    private var plans: [WeekPlan] {
        Course.shared.allWeeks.map { WeekPlan(weekN: $0.n, lessons: weekLessons($0, articles: articles)) }
    }

    func testSeededRandomMatchesWeb() throws {
        for c in try fx.rng {
            XCTAssertEqual(hashSeed(c.seed), c.hash, c.seed)
            let rng = SeededRandom(c.seed)
            XCTAssertEqual(c.values.map { _ in rng.next() }, c.values, c.seed)
            XCTAssertEqual(SeededRandom(c.seed).shuffled(Array(0...9)), c.shuffle, c.seed)
        }
    }

    func testStrictCheckersMatchWeb() throws {
        for c in try fx.drill {
            XCTAssertEqual(checkDrill(expected: c.expected, given: c.given), c.ok, "\(c.expected) / \(c.given)")
        }
        for c in try fx.transform {
            XCTAssertEqual(checkTransform(answer: c.answer, typed: c.typed), c.ok, "\(c.answer) / \(c.typed)")
        }
    }

    func testEveryWeekPlanMatchesWebStepForStep() throws {
        let weeks = try fx.weeks
        XCTAssertEqual(weeks.count, Course.shared.totalWeeks)
        for expected in weeks {
            let week = try XCTUnwrap(Course.shared.week(expected.n))
            let lessons = weekLessons(week, articles: articles)
            XCTAssertEqual(lessons.map(\.key), expected.lessons.map(\.key), "week \(expected.n)")
            for (l, e) in zip(lessons, expected.lessons) {
                XCTAssertEqual(l.n, e.n, l.key)
                XCTAssertEqual(l.kind.rawValue, e.kind, l.key)
                XCTAssertEqual(l.title, e.title, l.key)
                XCTAssertEqual(l.sub, e.sub, l.key)
                XCTAssertEqual(l.words, e.words, l.key)
                XCTAssertEqual(l.minutes, e.minutes, l.key)
                XCTAssertEqual(l.steps.count, e.steps.count, l.key)
                for (s, es) in zip(l.steps, e.steps) {
                    XCTAssertEqual(StepFx(s), es, "\(l.key) #\(es.id) \(es.kind)")
                }
            }
        }
    }

    func testRunsAndSrsGradesMatchWeb() throws {
        let all = plans.flatMap(\.lessons)
        for c in try fx.runs {
            let lesson = try XCTUnwrap(all.first { $0.key == c.key })
            var run = LessonRun(lesson)
            while let step = run.current {
                let correct: Bool? = step.isGraded ? (step.retry ? true : !c.miss.contains(step.id)) : nil
                run = run.advanced(correct: correct)
            }
            let at = "\(c.key) miss \(c.miss)"
            XCTAssertEqual(run.queue.map { "\($0.id)\($0.retry ? "r" : "")" }, c.queue, at)
            XCTAssertEqual(Dictionary(uniqueKeysWithValues: run.first.map { (String($0.key), $0.value) }), c.first, at)
            XCTAssertEqual(run.summary, LessonSummary(graded: c.summary.graded, correct: c.summary.correct, pct: c.summary.pct), at)
            let grades = lessonSrsGrades(lesson, run: run, store: c.store, now: c.now)
            XCTAssertEqual(grades.map { "\($0.term)=\($0.grade.rawValue)" }, c.grades, at)
        }
    }

    func testContinueDecisionMatchesWeb() throws {
        let plans = self.plans
        for c in try fx.next {
            let store = c.done.reduce(LessonStore()) { $0.completing($1, pct: 100, date: "2026-01-01") }
            let action = nextLessonAction(plans: plans, store: store, currentWeekN: c.currentWeekN, due: c.due)
            let at = "week \(String(describing: c.currentWeekN)) due \(c.due) done \(c.done.count)"
            switch action {
            case .lesson(let lesson, let ahead):
                XCTAssertEqual(c.out.kind, "lesson", at)
                XCTAssertEqual(lesson.key, c.out.key, at)
                XCTAssertEqual(ahead, c.out.ahead, at)
            case .review(let due):
                XCTAssertEqual(c.out.kind, "review", at)
                XCTAssertEqual(due, c.out.due, at)
            case .done:
                XCTAssertEqual(c.out.kind, "done", at)
            }
        }
    }

    func testSmartMixMatchesWeb() throws {
        let cards = Course.shared.allVocab
        for c in try fx.mix {
            let card = try XCTUnwrap(cards.first { $0.it == c.it })
            let state = c.hasState ? SRSCard(reps: c.reps ?? 0, relearn: c.relearn) : nil
            XCTAssertEqual(reviewStyle(for: card, state: state, articles: articles).rawValue, c.style,
                           "\(c.it) reps \(String(describing: c.reps)) relearn \(String(describing: c.relearn))")
        }
    }
}

final class LessonsLogicTests: XCTestCase {
    private var lessons: [Lesson] {
        Course.shared.allWeeks.flatMap { weekLessons($0, articles: articles) }
    }

    func testEveryGradedStepPassesItsSolutionAndFailsAWrongAnswer() throws {
        var graded = 0
        for lesson in lessons {
            for step in lesson.steps {
                let at = "\(lesson.key) #\(step.id) \(step.kind.rawValue)"
                guard step.isGraded else {
                    XCTAssertNil(checkLessonStep(step, value: nil, articles: articles).correct, at)
                    continue
                }
                graded += 1
                let solution = try XCTUnwrap(lessonSolution(step), at)
                XCTAssertTrue(isLessonStepReady(step, value: solution), at)
                XCTAssertEqual(checkLessonStep(step, value: solution, articles: articles).correct, true, at)
                let wrong: LessonValue
                switch solution {
                case .bool(let b): wrong = .bool(!b)
                case .index(let i): wrong = .index((i + 1) % step.options.count)
                case .order(let o): wrong = .order(o.reversed())
                default: wrong = .text("zzzzzzzz")
                }
                XCTAssertEqual(checkLessonStep(step, value: wrong, articles: articles).correct, false, at)
            }
        }
        XCTAssertGreaterThan(graded, 1000)
    }

    func testUnansweredStepsAreNotReady() {
        let lesson = lessons[0]
        for step in lesson.steps where step.isGraded {
            XCTAssertFalse(isLessonStepReady(step, value: nil))
            XCTAssertFalse(isLessonStepReady(step, value: .text("  ")))
        }
        let match = lesson.steps.first { $0.kind == .match }!
        XCTAssertFalse(isLessonStepReady(match, value: nil))
        XCTAssertTrue(isLessonStepReady(match, value: .done))
    }

    func testStoreUsesTheWebJSONShape() throws {
        let web = #"{"done":{"1.1":{"date":"2026-01-01","pct":90,"times":2},"1.2":{"date":"2026-01-02","pct":100}}}"#
        let store = try JSONDecoder().decode(LessonStore.self, from: Data(web.utf8))
        XCTAssertEqual(store.done["1.1"], LessonRecord(date: "2026-01-01", pct: 90, times: 2))
        XCTAssertEqual(store.done["1.2"]?.times, 1)
        let round = try JSONDecoder().decode(LessonStore.self, from: JSONEncoder().encode(store))
        XCTAssertEqual(round, store)
        // Junk degrades to empty rather than throwing a backup import away.
        XCTAssertEqual(try JSONDecoder().decode(LessonStore.self, from: Data(#"{"done":null}"#.utf8)), LessonStore())
    }

    func testRepeatKeepsBestScoreAndFirstDate() {
        let store = LessonStore().completing("1.1", pct: 90, date: "2026-01-01")
            .completing("1.1", pct: 60, date: "2026-02-02")
        XCTAssertEqual(store.done["1.1"], LessonRecord(date: "2026-01-01", pct: 90, times: 2))
    }

    func testWeekCompletion() {
        let week1 = lessons.filter { $0.weekN == 1 }
        var store = LessonStore()
        XCTAssertFalse(store.isWeekComplete(week1))
        for l in week1.dropLast() { store = store.completing(l.key, pct: 100, date: "2026-01-01") }
        XCTAssertFalse(store.isWeekComplete(week1))
        XCTAssertEqual(store.progress(week1).done, week1.count - 1)
        store = store.completing(week1.last!.key, pct: 100, date: "2026-01-01")
        XCTAssertTrue(store.isWeekComplete(week1))
        XCTAssertFalse(store.isWeekComplete([]))
    }
}
