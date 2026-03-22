// SectionsMobile/MobileSuspensionSection.jsx
import styled from "styled-components";
import MobilePanel from "./MobilePanel";
import MobileDnaModeRotary from "../UI/MobileUI/MobileDnaModeRotary";

const ActionPage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 16px;
`;

const DnaWrapper = styled.div`
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.02) 50%,
    rgba(192, 57, 43, 0.03) 100%
  );
`;

const WeightRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
`;

const WeightLabel = styled.span`
  font-family: "Orbitron", sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffffff;
`;

const WeightBar = styled.div`
  flex: 1;
  height: 4px;
  background: linear-gradient(90deg, #c0392b 50%, #4a90d9 50%);
  border-radius: 2px;
  position: relative;

  &::before {
    content: "F";
    position: absolute;
    left: 0;
    top: -14px;
    font-family: "Orbitron", sans-serif;
    font-size: 0.5rem;
    color: #c0392b;
  }

  &::after {
    content: "R";
    position: absolute;
    right: 0;
    top: -14px;
    font-family: "Orbitron", sans-serif;
    font-size: 0.5rem;
    color: #4a90d9;
  }
`;

/* Specs list for details page */
const SpecItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
`;

const SpecIcon = styled.div`
  width: 28px;
  height: 28px;
  min-width: 28px;
  background: linear-gradient(
    145deg,
    rgba(192, 57, 43, 0.15),
    rgba(139, 0, 0, 0.1)
  );
  border: 1px solid rgba(192, 57, 43, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 13px;
    height: 13px;
    stroke: #c0392b;
    fill: none;
    stroke-width: 2;
  }
`;

const SpecText = styled.div`
  flex: 1;

  h4 {
    font-family: "Orbitron", sans-serif;
    font-size: 0.68rem;
    color: #ffffff;
    margin: 0 0 2px;
    letter-spacing: 0.04em;
  }

  p {
    font-family: "Rajdhani", sans-serif;
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.4);
    line-height: 1.3;
    margin: 0;
  }
`;

const SwipeHint = styled.div`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.2);
  text-align: center;
  margin-top: auto;
  padding-top: 8px;
`;

export default function MobileSuspensionSection({
    id,
    onModeChange,
}) {
    return (
        <MobilePanel
            id={id}
            label="Dynamics"
            title="Suspension & Chassis"
            action={
                <ActionPage>
                    <DnaWrapper>
                        <MobileDnaModeRotary onModeChange={onModeChange} />
                    </DnaWrapper>

                    <WeightRow>
                        <WeightLabel>50</WeightLabel>
                        <WeightBar />
                        <WeightLabel>50</WeightLabel>
                    </WeightRow>

                    <SwipeHint>Swipe for specs →</SwipeHint>
                </ActionPage>
            }
            details={
                <>
                    <SpecItem>
                        <SpecIcon>
                            <svg viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </SpecIcon>
                        <SpecText>
                            <h4>Alfa™ Active Suspension</h4>
                            <p>
                                Electronically controlled shock absorbers with
                                continuous damping adjustment
                            </p>
                        </SpecText>
                    </SpecItem>

                    <SpecItem>
                        <SpecIcon>
                            <svg viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l4 2" />
                            </svg>
                        </SpecIcon>
                        <SpecText>
                            <h4>Carbon Fiber Driveshaft</h4>
                            <p>
                                Lightweight construction for reduced rotational mass
                                and improved response
                            </p>
                        </SpecText>
                    </SpecItem>

                    <SpecItem>
                        <SpecIcon>
                            <svg viewBox="0 0 24 24">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                        </SpecIcon>
                        <SpecText>
                            <h4>Torque Vectoring Differential</h4>
                            <p>
                                Active rear differential for precise power
                                distribution through corners
                            </p>
                        </SpecText>
                    </SpecItem>
                </>
            }
        />
    );
}