import React from "react";
import styles from "../styles/storagesettingstab.module.css";

/**
 * StorageSettingsTab Wireframe
 * Visual wireframe for storage settings with a "Buildings" section styled as a horizontal scrollable card list.
 *
 * @component
 * @returns {JSX.Element}
 */
const demoBuildings = [
    {
        id: 1,
        name: "HQ - Main",
        address: "123 Main St.",
        manager: "Jane Doe",
    },
    {
        id: 2,
        name: "HQ - Warehouse",
        address: "101 Storage Rd.",
        manager: "John Smith",
    },
    {
        id: 3,
        name: "Remote Office",
        address: "55 West St.",
        manager: "Sam Green",
    },
    {
        id: 4,
        name: "Research Annex",
        address: "77 Science Park",
        manager: "Ava Robinson",
    },
];

const StorageSettingsTab = () => (
    <div className={styles.tabRoot}>
        <div className={styles.sectionHeaderRow}>
            <h2 className={styles.sectionTitle}>Buildings</h2>
            <button className={styles.allButton}>See All</button>
        </div>
        <div className={styles.cardsScrollRow}>
            {demoBuildings.map((building) => (
                <div key={building.id} className={styles.buildingCard}>
                    <div className={styles.buildingThumbnail} />
                    <div className={styles.buildingInfo}>
                        <div className={styles.buildingName}>{building.name}</div>
                        <div className={styles.buildingAddress}>{building.address}</div>
                        <div className={styles.buildingManager}>
                            <span className={styles.managerLabel}>Manager:</span>{" "}
                            <span>{building.manager}</span>
                        </div>
                    </div>
                </div>
            ))}
            {/* Optionally, a "Add Building" card */}
            <div className={styles.buildingCardAdd}>
                <span className={styles.addIcon}>+</span>
                <div className={styles.addLabel}>Add Building</div>
            </div>
        </div>
        {/* Additional storage settings wireframe sections can go below */}
    </div>
);

export default StorageSettingsTab;