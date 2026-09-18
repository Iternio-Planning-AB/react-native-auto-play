//
//  PointOfInterestTemplate.swift
//  Pods
//

import CarPlay
import MapKit

class PointOfInterestTemplate: AutoPlayTemplate, CPPointOfInterestTemplateDelegate {
    /// CarPlay shows the first 12 points of interest only, so rendering pins for more is wasted work.
    private static let maximumPointsOfInterest = 12

    private(set) var template: CPPointOfInterestTemplate
    var config: PointOfInterestTemplateConfig

    private var items: [PointOfInterest]

    override var autoDismissMs: Double? {
        return config.autoDismissMs
    }

    override func getTemplate() throws -> CPTemplate {
        return template
    }

    init(config: PointOfInterestTemplateConfig) {
        self.config = config
        self.items = config.items

        let colors = PinColors.from(
            config.colors,
            traitCollection: SceneStore.getRootTraitCollection()
        )
        let pointsOfInterest = config.items.prefix(PointOfInterestTemplate.maximumPointsOfInterest)
            .map {
                PointOfInterestTemplate.buildPointOfInterest($0, colors: colors)
            }

        template = CPPointOfInterestTemplate(
            title: Parser.parseText(text: config.title) ?? "",
            pointsOfInterest: pointsOfInterest,
            selectedIndex: NSNotFound,
            id: config.id
        )

        super.init()

        template.pointOfInterestDelegate = self
    }

    @MainActor
    override func _invalidate() {
        updatePointsOfInterest()
    }

    @MainActor
    func updateItems(items: [PointOfInterest]) {
        self.items = items
        updatePointsOfInterest()
    }

    @MainActor
    private func updatePointsOfInterest() {
        let colors = PinColors.from(
            config.colors,
            traitCollection: SceneStore.getRootTraitCollection()
        )

        template.setPointsOfInterest(
            items.prefix(PointOfInterestTemplate.maximumPointsOfInterest).map {
                PointOfInterestTemplate.buildPointOfInterest($0, colors: colors)
            },
            selectedIndex: NSNotFound
        )
    }

    private static func buildPointOfInterest(
        _ item: PointOfInterest,
        colors: PinColors
    ) -> CPPointOfInterest {
        let title = Parser.parseText(text: item.title) ?? ""
        let summary = item.line2 ?? ""

        let mapItem = MKMapItem(
            placemark: MKPlacemark(coordinate: CLLocationCoordinate2DMake(item.lat, item.lng))
        )
        mapItem.name = title

        let pinImage = PinBitmapRenderer.render(
            status: item.status ?? .inactive,
            available: Int(item.available ?? 0),
            total: Int(item.total ?? 1),
            hasBadge: item.hasBadge ?? false,
            isHighlighted: item.isHighlighted ?? false,
            colors: colors
        )

        return CPPointOfInterest(
            location: mapItem,
            title: title,
            subtitle: item.line1 ?? "",
            summary: summary.isEmpty ? nil : summary,
            detailTitle: nil,
            detailSubtitle: nil,
            detailSummary: nil,
            pinImage: pinImage
        )
    }

    override func onWillAppear(animated: Bool) {
        config.onWillAppear?(animated)
    }

    override func onDidAppear(animated: Bool) {
        config.onDidAppear?(animated)
    }

    override func onWillDisappear(animated: Bool) {
        config.onWillDisappear?(animated)
    }

    override func onDidDisappear(animated: Bool) {
        config.onDidDisappear?(animated)
    }

    override func onPopped() {
        config.onPopped?()
    }

    func pointOfInterestTemplate(
        _ pointOfInterestTemplate: CPPointOfInterestTemplate,
        didSelectPointOfInterest pointOfInterest: CPPointOfInterest
    ) {
        guard
            let index = pointOfInterestTemplate.pointsOfInterest.firstIndex(where: {
                $0 === pointOfInterest
            }),
            index < items.count
        else { return }

        config.onSelectItem?(items[index].id)
    }

    /// The host drives the visible map region itself; there is nothing to forward to JS.
    func pointOfInterestTemplate(
        _ pointOfInterestTemplate: CPPointOfInterestTemplate,
        didChangeMapRegion region: MKCoordinateRegion
    ) {}
}
