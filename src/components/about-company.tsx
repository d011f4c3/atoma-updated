"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./cart-drawer";
import { ThemeSwitcher } from "./theme-switcher";
import styles from "./about-company.module.css";

export function AboutCompany() {
  const { busy } = useCart();

  return (
    <main className={styles.main} lang="en" id="about-top" data-about-company>
      <section className={styles.opening} aria-labelledby="about-title">
        <div className={styles.openingHeading}>
          <div>
            <span className={styles.eyebrow}>
              The company / An introduction
            </span>
            <h1 id="about-title">About ATOMA.</h1>
          </div>
          <span className={styles.operator}>Operated by GVJ</span>
        </div>
        <div className={styles.companyOpening}>
          <div className={styles.companyStatement}>
            <span className={styles.statementMark} aria-hidden="true">
              [ A ]
            </span>
            <h2>
              A clearer way to choose matcha.
              <br />A closer connection to its world.
            </h2>
            <p>
              We bring together knowledge of matcha, the applications it is
              selected for, and relationships with the people and places behind
              it.
            </p>
            <div className={styles.companyTopics}>
              <Link href="#about-approach">
                <span>01</span>
                <span>Our approach</span>
                <span aria-hidden="true">↗</span>
              </Link>
              <Link href="#about-wazuka">
                <span>02</span>
                <span>People & place</span>
                <span aria-hidden="true">↗</span>
              </Link>
              <Link href="#about-technology">
                <span>03</span>
                <span>Supporting the work</span>
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
          <figure className={styles.companyPortrait}>
            <div>
              <Image
                src="/images/origins/field-work.webp"
                alt="An archive photograph of a grower at work. Placeholder for ATOMA’s new photography of the people and harvest in Wazuka."
                fill
                preload
                sizes="(max-width:760px) 90vw, 57vw"
              />
            </div>
            <figcaption>
              <span>People behind the work / Wazuka</span>
              <span>Archive placeholder</span>
            </figcaption>
          </figure>
        </div>
        <div className={styles.openingFoot}>
          <Link href="#about-approach">
            Explore the story <span aria-hidden="true">↓</span>
          </Link>
          <span className={styles.depth}>
            Approach <i aria-hidden="true" /> Relationships{" "}
            <i aria-hidden="true" /> Work
          </span>
          <ThemeSwitcher />
        </div>
      </section>

      <section
        className={styles.approach}
        id="about-approach"
        aria-labelledby="approach-title"
      >
        <div className={styles.sectionHead}>
          <span>[ 01 ]</span>
          <span>The approach</span>
          <span>Material → Understanding</span>
        </div>
        <div className={styles.approachGrid}>
          <div className={styles.approachCopy}>
            <h2 id="approach-title">
              Carefully specified.
              <br />
              Selected with purpose.
            </h2>
            <div className={styles.body}>
              <p>
                ATOMA makes matcha easier to understand, select and buy. We
                start with the application: what you want to make, and what you
                need from the material.
              </p>
              <p>
                Flavour, texture and performance bring the choice into focus.
                Place, harvest, processing and human judgment give it context.
              </p>
            </div>
            <Link
              href="/shop"
              className={styles.inlineShop}
              aria-label="Explore matcha in the shop"
              aria-disabled={busy || undefined}
              onNavigate={(event) => {
                if (busy) event.preventDefault();
              }}
            >
              Explore matcha <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className={styles.definition}>
            <div className={styles.definitionHead}>
              <span>ATOMA</span>
              <span>Brand / Definition</span>
            </div>
            <div className={styles.name}>
              <span>ATOM</span>
              <i aria-hidden="true">+</i>
              <span>MATCHA</span>
            </div>
            <p className={styles.nameMeaning}>
              Understanding the parts
              <br />
              that shape the whole.
            </p>
            <dl>
              <div>
                <dt>Starting point</dt>
                <dd>The application</dd>
              </div>
              <div>
                <dt>Considerations</dt>
                <dd>Flavour / Texture / Performance</dd>
              </div>
              <div>
                <dt>Operator</dt>
                <dd>GVJ</dd>
              </div>
            </dl>
            <p className={styles.company}>
              ATOMA is operated by GVJ. We connect a clear buying experience
              with the knowledge, people and places behind the material.
            </p>
          </div>
        </div>
      </section>

      <section
        className={styles.harvest}
        id="about-wazuka"
        aria-labelledby="harvest-title"
      >
        <div className={styles.sectionHead}>
          <span>[ 02 ]</span>
          <span>People & place</span>
          <span>First field entry</span>
        </div>
        <div className={styles.fieldTitle}>
          <h2 id="harvest-title">
            The first field entry.
            <br />A harvest weekend in Wazuka.
          </h2>
          <span>
            Wazuka
            <br />
            Kyoto, Japan
          </span>
        </div>
        <div className={styles.fieldRecord}>
          <figure className={styles.fieldPhoto}>
            <div>
              <Image
                src="/images/origins/field-work.webp"
                alt="An archive photograph of a grower at work among tea plants. Placeholder for the new Wazuka harvest photographs."
                fill
                sizes="(max-width:760px) 90vw, 60vw"
              />
              <span className={styles.photoIndex}>01 / Harvest</span>
            </div>
            <figcaption>
              <span>At work in the fields</span>
              <span>Archive placeholder</span>
            </figcaption>
          </figure>
          <div className={styles.fieldCopy}>
            <span className={styles.eyebrow}>First entry / The harvest</span>
            <h3>A weekend in Wazuka.</h3>
            <div className={styles.body}>
              <p>
                Our first entry begins with a weekend in Wazuka, photographing
                the harvest and the people doing the work.
              </p>
              <p>
                Time in the fields is a starting point for understanding the
                knowledge behind the material. This is where we begin to share
                our relationships with tea-growing communities.
              </p>
            </div>
            <div className={styles.fieldNext}>
              <span>Continuing the record</span>
              <p>
                Future entries will document visits, community activities and
                support work as they happen.
              </p>
            </div>
          </div>
        </div>
        <div className={styles.fieldFooter}>
          <span aria-hidden="true">↳</span>
          <p>
            Our involvement with a place is separate from the origin recorded
            for each matcha.
          </p>
          <span>New harvest photography to follow</span>
        </div>
      </section>

      <section
        className={styles.technology}
        id="about-technology"
        aria-labelledby="technology-title"
      >
        <div className={styles.sectionHead}>
          <span>[ 03 ]</span>
          <span>People & technology</span>
          <span>A story to follow</span>
        </div>
        <div className={styles.technologyIntro}>
          <h2 id="technology-title">
            Tools extend the work.
            <br />
            Knowledge stays human.
          </h2>
          <div className={styles.body}>
            <p>
              Technology can support the task and the person. Experience and
              judgment remain with the grower.
            </p>
            <p>
              Our next story follows an older grower with a drone and a
              powersuit that supports his limbs. His perspective is the starting
              point.
            </p>
          </div>
        </div>
        <div className={styles.technologyPair}>
          <figure>
            <div className={styles.toolPhoto}>
              <Image
                src="/images/origins/field-work.webp"
                alt="Archive photograph used only as a placeholder for the forthcoming portrait of a grower holding a drone."
                fill
                sizes="(max-width:760px) 44vw, 45vw"
              />
              <span>01 / Image placeholder</span>
            </div>
            <figcaption>
              <span>The grower & the drone</span>
              <span>Portrait to follow</span>
            </figcaption>
          </figure>
          <div className={styles.pairAxis} aria-hidden="true">
            <span>Human</span>
            <i />
            <span>Tool</span>
          </div>
          <figure>
            <div className={styles.toolPhoto}>
              <Image
                src="/images/origins/tea-handling.jpg"
                alt="Archive image of tea work used only as a placeholder for the forthcoming photograph of a grower using a powersuit."
                fill
                sizes="(max-width:760px) 44vw, 45vw"
              />
              <span>02 / Image placeholder</span>
            </div>
            <figcaption>
              <span>The powersuit in use</span>
              <span>Portrait to follow</span>
            </figcaption>
          </figure>
        </div>
        <p className={styles.preparation}>
          One grower’s perspective / Story and photography in preparation.
        </p>
      </section>

      <section className={styles.closing} aria-labelledby="selection-title">
        <span className={styles.eyebrow}>
          ATOMA / Carefully specified matcha
        </span>
        <h2 id="selection-title">
          The deeper you go,
          <br />
          the more human it becomes.
        </h2>
        <Link
          href="/shop"
          aria-disabled={busy || undefined}
          onNavigate={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          Find your matcha <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}
