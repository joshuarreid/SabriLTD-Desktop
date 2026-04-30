/**
 * CompanyInfoCard.jsx
 *
 * Presentational company card used by CompanySettingsTab.
 * Extracted from the main CompanySettingsTab to keep the tab component focused
 * on orchestration/business logic while this component remains purely presentational.
 *
 * Conventions:
 *  - Pure UI (no side-effects)
 *  - Uses CSS module ../styles/companysettingstab.module.css
 *  - Exposes a small, well-documented prop surface
 */

import React from "react";
import styles from "../styles/companyinfocard.module.css";

/**
 * logger for CompanyInfoCard.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[CompanyInfoCard]", ...args),
    error: (...args) => console.error("[CompanyInfoCard]", ...args),
};

/**
 * CompanyInfoCard
 *
 * Presentational card for a single company.
 *
 * @component
 * @param {Object} props
 * @param {{companyId:number, name:string, address?:string, phone?:string, website?:string}} props.company - Company data to render.
 * @param {boolean} [props.selected=false] - Whether the card is in selected state.
 * @param {(company:object) => void} [props.onClick] - Called when the card is clicked (select).
 * @param {(company:object) => void} [props.onEdit] - Called when the edit action is triggered.
 * @param {(companyId:number) => void} [props.onDelete] - Called when the delete action is triggered.
 * @returns {JSX.Element}
 */
const CompanyInfoCard = ({ company, selected = false, onClick, onEdit, onDelete }) => {
    logger.info("CompanyInfoCard rendered", { companyId: company?.companyId, selected });

    return (
        <button
            type="button"
            className={
                styles.companyCard + (selected ? ` ${styles.selectedCard || ""}` : "")
            }
            onClick={() => onClick && onClick(company)}
            aria-label={selected ? `Company ${company.name}, selected` : `Company ${company.name}`}
        >
            {/* small yellow dot, visibility controlled by CSS (hover/selected/focus) */}
            <span className={styles.statusDot} />

            <div className={styles.avatar}>
                {company.name?.[0]?.toUpperCase() || "C"}
            </div>

            <div className={styles.companyInfo}>
                <div className={styles.companyName}>{company.name}</div>
                {company.address && <div className={styles.companyMeta}>{company.address}</div>}
                {(company.website || company.phone) && (
                    <div className={styles.companyMetaSecondary}>
                        {company.website || company.phone}
                    </div>
                )}
            </div>

            {/* Delete button — stop propagation so parent onClick (select) isn't triggered */}
            <button
                type="button"
                className={styles.cardDeleteBtn}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onDelete) onDelete(company.companyId);
                }}
                aria-label={`Delete company ${company.name}`}
            >
                ×
            </button>
        </button>
    );
};

export default CompanyInfoCard;