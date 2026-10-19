"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./cart-drawer";
import { ThemeSwitcher } from "./theme-switcher";
import styles from "./about-relationships.module.css";

export function AboutRelationships() {
  const { busy } = useCart();

  return (
    <main
      className={styles.main}
      lang="en"
      data-about-relationships
      id="relationships-top"
    >
      <section className={styles.opening} aria-labelledby="relationships-title">
        <div className={styles.openingTop}>
          <span className={styles.label}>An introduction to ATOMA</span>
          <span className={styles.label}>
            The company / The approach / The relationships
          </span>
        </div>
        <div className={styles.openingLayout}>
          <div className={styles.openingCopy}>
            <span className={styles.eyebrow}>Who we are</span>
            <h1 id="relationships-title">About ATOMA.</h1>
            <div className={styles.body}>
              <p>
                We connect a clear way to choose matcha with the knowledge,
                people and places behind it.
              </p>
              <p>
                Our approach begins with the application. Our first field story
                begins in Wazuka.
              </p>
            </div>
          </div>
          <nav
            className={styles.relationshipMap}
            data-relationship-map
            aria-label="Explore ATOMA's relationships"
          >
            <svg
              className={styles.mapLines}
              viewBox="0 0 800 500"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                className={styles.connection}
                d="M245 250H356M356 85V415M356 85H475M356 250H475M356 415H475"
              />
              <g className={styles.junctions}>
                <circle cx="356" cy="85" r="2" />
                <circle cx="356" cy="250" r="3" />
                <circle cx="356" cy="415" r="2" />
              </g>
            </svg>
            <svg
              className={styles.mobileMapLines}
              viewBox="0 0 360 450"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                className={styles.connection}
                d="M180 82V116H27V385M27 175H75M27 280H75M27 385H75"
              />
              <g className={styles.junctions}>
                <circle cx="27" cy="175" r="2" />
                <circle cx="27" cy="280" r="2" />
                <circle cx="27" cy="385" r="2" />
              </g>
            </svg>
            <div className={styles.identityNode}>
              <span>Company / Storefront</span>
              <strong>ATOMA</strong>
              <span>Operated by GVJ</span>
            </div>
            <Link
              className={`${styles.mapTopic} ${styles.selectionTopic}`}
              href="#relationships-approach"
            >
              <span className={styles.topicLabel}>01 / Selection</span>
              <span className={styles.topicTitle}>For the application.</span>
              <span className={styles.topicArrow} aria-hidden="true">
                ↗
              </span>
            </Link>
            <Link
              className={`${styles.mapTopic} ${styles.placeTopic}`}
              href="#relationships-wazuka"
            >
              <span className={styles.topicLabel}>02 / People & place</span>
              <span className={styles.topicTitle}>Beginning in Wazuka.</span>
              <span className={styles.topicArrow} aria-hidden="true">
                ↗
              </span>
            </Link>
            <Link
              className={`${styles.mapTopic} ${styles.workTopic}`}
              href="#relationships-technology"
            >
              <span className={styles.topicLabel}>03 / Human work</span>
              <span className={styles.topicTitle}>Tools that support it.</span>
              <span className={styles.topicArrow} aria-hidden="true">
                ↗
              </span>
            </Link>
          </nav>
        </div>
        <div className={styles.openingActions}>
          <Link className={styles.storyLink} href="#relationships-approach">
            Explore the story <span aria-hidden="true">↓</span>
          </Link>
          <span className={styles.label}>
            An approach made tangible through people and places.
          </span>
          <ThemeSwitcher />
        </div>
      </section>

      <section
        className={styles.approach}
        id="relationships-approach"
        aria-labelledby="relationships-approach-title"
      >
        <div className={styles.sectionHeading}>
          <span className={styles.label}>01 / Information</span>
          <h2 id="relationships-approach-title">A method for choosing well.</h2>
          <span className={styles.label}>The approach behind ATOMA</span>
        </div>
        <div className={styles.methodRecord}>
          <div className={styles.recordRow}>
            <span className={styles.recordLabel}>
              Selection
              <br />
              <span>Application first</span>
            </span>
            <h3>
              What do you
              <br />
              want to make?
            </h3>
            <div className={styles.body}>
              <p>
                Tea with water, a latte, or a recipe. The intended application
                gives the choice its context. Flavour, texture and performance
                help you understand what you need from the matcha.
              </p>
              <div className={styles.useLine}>
                <span>Water</span>
                <span>Milk</span>
                <span>Recipe</span>
              </div>
            </div>
          </div>
          <div className={styles.recordRow}>
            <span className={styles.recordLabel}>
              Name
              <br />
              <span>Parts → Whole</span>
            </span>
            <h3>ATOM + MATCHA</h3>
            <p className={styles.body}>
              ATOMA expresses a way of looking: understanding the parts that
              shape the whole. Place, harvest, processing and human judgement
              all contribute to the material.
            </p>
          </div>
          <div className={styles.recordRow}>
            <span className={styles.recordLabel}>
              Operator
              <br />
              <span>The company</span>
            </span>
            <h3>Behind ATOMA.</h3>
            <p className={styles.body}>
              ATOMA is operated by GVJ. We connect a clear buying experience
              with knowledge of the material and our relationships with the
              places and communities we work with.
            </p>
          </div>
        </div>
      </section>

      <section
        className={styles.wazuka}
        id="relationships-wazuka"
        aria-labelledby="relationships-wazuka-title"
      >
        <div className={styles.sectionHeading}>
          <span className={styles.label}>02 / Origin & people</span>
          <h2 id="relationships-wazuka-title">The first entry. Wazuka.</h2>
          <span className={styles.label}>Field documentation / Kyoto</span>
        </div>
        <div className={styles.fieldRecord}>
          <div className={styles.fieldRecordTop}>
            <span>Wazuka, Kyoto</span>
            <span>Landscape / Work / People</span>
          </div>
          <div className={styles.fieldPhotographs}>
            <figure className={styles.landscape}>
              <div className={styles.photoFrame}>
                <Image
                  src="/images/origins/field-landscape.webp"
                  alt="Tea fields from the regional archive, a placeholder for the new Wazuka harvest photographs."
                  fill
                  sizes="(max-width:760px) 100vw, 64vw"
                />
              </div>
              <figcaption>
                <span>The setting</span>
                <span>Archive placeholder</span>
              </figcaption>
            </figure>
            <figure className={styles.fieldPortrait}>
              <div className={styles.photoFrame}>
                <Image
                  src="/images/origins/field-work.webp"
                  alt="A grower at work among tea plants, from the regional archive. Placeholder for the new harvest photographs."
                  fill
                  sizes="(max-width:760px) 60vw, 30vw"
                />
              </div>
              <figcaption>
                <span>People at work</span>
                <span>Archive placeholder</span>
              </figcaption>
            </figure>
          </div>
          <div className={styles.harvestNarrative} data-about-first-entry>
            <div>
              <span className={styles.label}>Our first entry</span>
              <h3>
                A harvest weekend
                <br />
                in Wazuka.
              </h3>
            </div>
            <p>
              The first entry begins with a weekend spent photographing the
              harvest and the people doing the work. Time in the fields brings
              the landscape and the knowledge behind the material into view.
            </p>
            <p>
              Wazuka is our first working region. This visit is a starting point
              for sharing the relationships we build there. Future entries will
              record community activities and support work as they happen.
            </p>
          </div>
          <div className={styles.fieldRecordBottom}>
            <span>New harvest photography to follow.</span>
            <span>First entry / Wazuka</span>
          </div>
        </div>
        <p className={styles.provenance}>
          Our involvement with a community is separate from the origin of a
          particular matcha. Product origins are recorded with each product.
        </p>
      </section>

      <section
        className={styles.technology}
        id="relationships-technology"
        aria-labelledby="relationships-technology-title"
      >
        <div className={styles.sectionHeading}>
          <span className={styles.label}>03 / People & technology</span>
          <h2 id="relationships-technology-title">
            Extend the work.
            <br />
            Keep the knowledge human.
          </h2>
          <span className={styles.label}>A story to follow</span>
        </div>
        <div className={styles.technologyIntro}>
          <p>
            A new tool can support the task and the person. Experience and
            judgement remain with the grower.
          </p>
          <p>
            Our next story follows an older grower holding a drone and using a
            powersuit to support his limbs. His perspective will guide a closer
            look at the work and the tools around it.
          </p>
        </div>
        <div className={styles.toolRecords}>
          <figure className={styles.toolPhoto}>
            <div className={styles.toolRecordHead}>
              <span>01 / The grower & the drone</span>
              <span>Portrait to follow</span>
            </div>
            <div className={styles.photoFrame}>
              <Image
                src="/images/origins/field-work.webp"
                alt="Archive grower image used only as a composition placeholder for the forthcoming portrait of a grower holding a drone."
                fill
                sizes="(max-width:760px) 45vw, 46vw"
              />
              <span className={styles.placeholderLabel}>Image placeholder</span>
            </div>
            <figcaption>The person and the tool, in the same frame.</figcaption>
          </figure>
          <figure className={styles.toolPhoto}>
            <div className={styles.toolRecordHead}>
              <span>02 / The powersuit in use</span>
              <span>Portrait to follow</span>
            </div>
            <div className={styles.photoFrame}>
              <Image
                src="/images/origins/tea-handling.jpg"
                alt="Archive tea-work image used only as a composition placeholder for the forthcoming photograph of a grower wearing a powersuit."
                fill
                sizes="(max-width:760px) 45vw, 46vw"
              />
              <span className={styles.placeholderLabel}>Image placeholder</span>
            </div>
            <figcaption>Support for the person doing the work.</figcaption>
          </figure>
        </div>
        <p className={styles.preparation}>
          Story and photography in preparation.
        </p>
      </section>

      <section
        className={styles.closing}
        aria-labelledby="relationships-shop-title"
      >
        <div>
          <span className={styles.label}>From understanding to selection</span>
          <h2 id="relationships-shop-title">Matcha for what you make.</h2>
          <p>Explore the matcha, its qualities and its applications.</p>
        </div>
        <Link
          href="/shop"
          className={styles.shopLink}
          aria-label="Explore matcha in the shop"
          aria-disabled={busy || undefined}
          onNavigate={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          Explore matcha <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}
