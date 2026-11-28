import Image from "next/image";

export function OpticalPortraitStage() {
  return (
    <div className="portrait-image-wrap" aria-label="Portrait of Java and DSA educator Kunal Kushwaha">
      <Image
        src="/assets/creator-portrait.png"
        alt="Kunal Kushwaha, Java and DSA educator"
        fill
        priority
        sizes="(max-width: 850px) 90vw, 42vw"
        className="portrait-image"
      />
      <div className="portrait-image-shade" aria-hidden="true" />
      <div className="portrait-image-caption"><strong>Kunal Kushwaha</strong><span>JAVA &amp; DSA EDUCATOR</span></div>
    </div>
  );
}
