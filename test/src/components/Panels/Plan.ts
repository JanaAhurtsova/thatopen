import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui";
import * as THREE from "three";

export default (
  components: OBC.Components,
  world: OBC.World,
  culler: OBC.MeshCullerRenderer,
  modelUuid: any,
) => {
  const panel = BUI.Component.create<BUI.PanelSection>(() => {
    return BUI.html`
    <bim-panel-section collapsed name="floorPlans" label="Plan list">
    </bim-panel-section>
    `;
  });

  setTimeout(async () => {
    const highlighter = components.get(OBF.Highlighter);
    const plans = components.get(OBF.Plans);
    const classifier = components.get(OBC.Classifier);
    const edges = components.get(OBF.ClipEdges);
    const fragments = components.get(OBC.FragmentsManager);
    const thickItems = classifier.find({
      entities: [
        "IFCCURTAINWALL",
        "IFCWALL",
        "IFCCOLUMN",
        "IFCBUILDINGELEMENTPROXY",
        "IFCBEAM",
        "IFCSLAB",
        "IFCSPACE",
      ],
    });

    const thinItems = classifier.find({
      entities: ["IFCDOOR", "IFCWINDOW", "IFCPLATE", "IFCMEMBER"],
    });
    const modelItems = classifier.find({ models: [modelUuid] });
    const grayFill = new THREE.MeshBasicMaterial({ color: "gray", side: 2 });
    const blackLine = new THREE.LineBasicMaterial({ color: "black" });
    const blackOutline = new THREE.MeshBasicMaterial({
      color: "black",
      opacity: 0.5,
      side: 2,
      transparent: true,
    });

    edges.styles.create(
      "thick",
      new Set(),
      world,
      blackLine,
      grayFill,
      blackOutline,
    );

    for (const fragID in thickItems) {
      const foundFrag = fragments.list.get(fragID);
      if (!foundFrag) continue;
      const { mesh } = foundFrag;
      edges.styles.list.thick.fragments[fragID] = new Set(thickItems[fragID]);
      edges.styles.list.thick.meshes.add(mesh);
    }
    edges.styles.create("thin", new Set(), world);

    for (const fragID in thinItems) {
      const foundFrag = fragments.list.get(fragID);
      if (!foundFrag) continue;
      const { mesh } = foundFrag;
      edges.styles.list.thin.fragments[fragID] = new Set(thinItems[fragID]);
      edges.styles.list.thin.meshes.add(mesh);
    }
    await edges.update(true);
    const whiteColor = new THREE.Color("white");
    // plans.create({ id: "id", name: "floors", ortho: false, normal: , });

    for (const plan of plans.list) {
      const planButton = BUI.Component.create<BUI.Checkbox>(() => {
        return BUI.html`
        <bim-button checked label="${plan.name}"
        @click="${() => {
          highlighter.backupColor = whiteColor;
          plans.goTo(plan.id);
          world.renderer!.postproduction.customEffects.minGloss = 0.1;
          classifier.setColor(modelItems, whiteColor);
          world.scene.three.background = whiteColor;
          culler.needsUpdate = true;
        }}">
        </bim-button>
        `;
      });

      panel.append(planButton);
    }
  }, 5000);
  return panel;
};
