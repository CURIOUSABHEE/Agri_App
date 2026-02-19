import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import CultivationStepper from "./CultivationStepper";
import CalendarView from "./CalendarView";
import api from "../../services/api";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';

const steps = ["Farm Details", "Crop Selection", "Cultivation Plan"];

const SmartCultivation = ({ language = "en", onNavigate }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        land_area: "",
        land_unit: "acres",
        soil_type: "",
        soil_ph: "",
        water_availability: "Moderate",
        season: "Kharif",
        budget: "",
        sowing_date: new Date().toISOString().split("T")[0],
        selected_crops: [],
        location: "",
        state: "Kerala"
    });
    const [recommendedCrops, setRecommendedCrops] = useState([]);
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activePlan, setActivePlan] = useState(null);
    const [savedPlans, setSavedPlans] = useState([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("farmerData"));
        const userId = userData?.id || "temp_user";
        fetchActivePlan(userId);
        fetchSavedPlans(userId);
    }, []);

    const fetchSavedPlans = async (userId) => {
        try {
            const response = await api.get(`/smart-cultivation/saved/${userId}`);
            if (response.data) setSavedPlans(response.data);
        } catch (err) {
            console.error("Error fetching saved plans:", err);
        }
    };

    const fetchActivePlan = async (userId) => {
        try {
            const response = await api.get(`/smart-cultivation/active/${userId}`);
            if (response.data) {
                setActivePlan(response.data);
                setGeneratedPlan(response.data);
                setActiveStep(2);
            }
        } catch (err) {
            console.error("Error fetching active plan:", err);
        }
    };

    const handleNext = async () => {
        if (activeStep === 0) {
            // Validate only the truly required fields
            if (!formData.land_area || !formData.soil_type) {
                alert("Please enter Land Area and select a Soil Type.");
                return;
            }

            setIsLoading(true);
            try {
                const predictionPayload = {
                    soil_type: formData.soil_type,
                    season: formData.season || "Kharif",
                    state: formData.state || "Kerala",
                    ph_level: formData.soil_ph ? parseFloat(formData.soil_ph) : null,
                    water_availability: (formData.water_availability || "moderate").toLowerCase(),
                    district: formData.location || "",
                    use_real_time_data: true
                };
                const res = await api.cropPredictionService.predictCrops(predictionPayload);
                if (res.success && res.recommendations) {
                    setRecommendedCrops(res.recommendations.map(r => r.crop));
                }
            } catch (err) {
                console.error("Crop prediction failed, proceeding anyway:", err);
            } finally {
                setIsLoading(false);
                setActiveStep((prev) => prev + 1);
            }

        } else if (activeStep === 1) {
            if (!formData.selected_crops || formData.selected_crops.length === 0) {
                alert("Please select at least one crop.");
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                const response = await api.post("/smart-cultivation/generate", formData);
                setGeneratedPlan(response.data);
                setActiveStep((prev) => prev + 1);
            } catch (err) {
                setError(err.message || "Failed to generate plan");
            } finally {
                setIsLoading(false);
            }

        } else {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
        setGeneratedPlan(null);
        setFormData({
            land_area: "",
            land_unit: "acres",
            soil_type: "",
            soil_ph: "",
            water_availability: "Moderate",
            season: "Kharif",
            budget: "",
            sowing_date: new Date().toISOString().split("T")[0],
            selected_crops: [],
            location: "",
            state: "Kerala"
        });
        setRecommendedCrops([]);
    };

    const handleSavePlan = async () => {
        try {
            setIsLoading(true);
            const response = await api.post("/smart-cultivation/save", generatedPlan);
            if (response.data.success) {
                alert("Plan saved successfully!");
                const userData = JSON.parse(localStorage.getItem("farmerData"));
                const userId = userData?.id || "temp_user";
                fetchActivePlan(userId);
                fetchSavedPlans(userId);
            } else {
                alert("Failed to save plan");
            }
        } catch (err) {
            console.error(err);
            alert("Error saving plan");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{ width: "100%", p: { xs: 1, sm: 3 } }}>
            <Typography variant="h4" gutterBottom component="div" sx={{ mb: 4, fontWeight: 'bold', color: '#2e7d32' }}>
                Smart Cultivation Pilot 🚜
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    onClick={() => setIsDrawerOpen(true)}
                >
                    Saved Plans ({savedPlans.length})
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleReset}
                >
                    New Plan
                </Button>
            </Box>

            <Drawer anchor="right" open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
                <Box sx={{ width: 300, p: 2 }}>
                    <Typography variant="h6" color="primary" gutterBottom>Saved Cultivation Plans</Typography>
                    <Divider />
                    <List>
                        {savedPlans.map((plan) => (
                            <ListItem key={plan.plan_id || Math.random()} disablePadding>
                                <ListItemButton onClick={() => {
                                    setGeneratedPlan(plan);
                                    setActiveStep(2);
                                    setIsDrawerOpen(false);
                                }}>
                                    <ListItemText
                                        primary={plan.crop_name}
                                        secondary={`Started: ${plan.start_date}`}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>

            <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Box sx={{ mt: 4, mb: 2 }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, flexDirection: 'column', gap: 2 }}>
                        <Box sx={{
                            width: 56, height: 56, borderRadius: '50%',
                            border: '4px solid #e8f5e9',
                            borderTop: '4px solid #2e7d32',
                            animation: 'spin 1s linear infinite',
                            '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }
                        }} />
                        <Typography color="success.dark" fontWeight="bold">
                            {activeStep === 1 ? "🌾 Generating your cultivation plan..." : "Analyzing farm data..."}
                        </Typography>
                    </Box>
                ) : activeStep === 2 && generatedPlan ? (
                    <CalendarView plan={generatedPlan} onSave={handleSavePlan} activePlan={activePlan} onNavigate={onNavigate} />
                ) : (
                    <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, maxWidth: 860, mx: "auto", borderRadius: 3 }}>
                        <CultivationStepper
                            activeStep={activeStep}
                            formData={formData}
                            setFormData={setFormData}
                            recommendedCrops={recommendedCrops}
                        />
                    </Paper>
                )}
            </Box>

            {activeStep !== 2 && (
                <Box sx={{ display: "flex", flexDirection: "row", pt: 2, maxWidth: 860, mx: "auto" }}>
                    <Button
                        color="inherit"
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        sx={{ mr: 1 }}
                    >
                        Back
                    </Button>
                    <Box sx={{ flex: "1 1 auto" }} />
                    <Button onClick={handleNext} variant="contained" color="success" disabled={isLoading}>
                        {activeStep === steps.length - 1 ? "Finish" : "Next"}
                    </Button>
                </Box>
            )}

            {error && (
                <Typography color="error" align="center" sx={{ mt: 2 }}>
                    {error}
                </Typography>
            )}
        </Box>
    );
};

export default SmartCultivation;
