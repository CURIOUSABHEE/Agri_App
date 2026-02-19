import React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Grid from "@mui/material/Grid";
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';

// Icons
import TerrainIcon from '@mui/icons-material/Terrain';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ScienceIcon from '@mui/icons-material/Science';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import PublicIcon from '@mui/icons-material/Public';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmojiNatureIcon from '@mui/icons-material/EmojiNature';

const soilTypes = [
    { value: "Alluvial", label: "Alluvial 🌊", desc: "Best for wheat, rice, sugarcane" },
    { value: "Black", label: "Black (Regur) ⚫", desc: "Ideal for cotton" },
    { value: "Red", label: "Red 🔴", desc: "Suitable for groundnut, millets" },
    { value: "Laterite", label: "Laterite 🟤", desc: "Tea, coffee, cashew" },
    { value: "Clay", label: "Clay 🧱", desc: "Rice, jute" },
    { value: "Sandy", label: "Sandy 🏜️", desc: "Requires more irrigation" },
    { value: "Loamy", label: "Loamy 🌱", desc: "Best for vegetables" },
];

const allCrops = [
    "Rice", "Coconut", "Rubber", "Banana", "Pepper", "Cardamom", "Tapioca",
    "Tea", "Coffee", "Wheat", "Mustard", "Cotton", "Sugarcane", "Maize",
    "Chickpea", "Groundnut", "Soybean", "Onion", "Tomato"
];

const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const SectionHeader = ({ icon, title, subtitle }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
        <Box sx={{
            width: 40, height: 40, borderRadius: 2,
            bgcolor: '#e8f5e9', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#2e7d32', flexShrink: 0
        }}>
            {icon}
        </Box>
        <Box>
            <Typography variant="subtitle1" fontWeight="bold" color="text.primary" lineHeight={1.2}>
                {title}
            </Typography>
            {subtitle && (
                <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
            )}
        </Box>
    </Box>
);

const CultivationStepper = ({ activeStep, formData, setFormData, recommendedCrops = [] }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMultiChange = (e) => {
        const { name, value } = e.target;
        const arr = typeof value === 'string' ? value.split(',') : value;
        if (arr.length <= 3) {
            setFormData(prev => ({ ...prev, [name]: arr }));
        }
    };

    if (activeStep === 0) {
        return (
            <Box>
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold" color="success.dark">
                        🌾 Farm Details
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Tell us about your farm so we can generate the perfect cultivation plan.
                    </Typography>
                </Box>

                <Grid container spacing={3}>

                    {/* ── Section: Land ── */}
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: '1px solid #e8f5e9', bgcolor: '#fafffe' }}>
                            <SectionHeader
                                icon={<AspectRatioIcon fontSize="small" />}
                                title="Land Information"
                                subtitle="How much land do you plan to cultivate?"
                            />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Land Area"
                                        name="land_area"
                                        type="number"
                                        value={formData.land_area || ''}
                                        onChange={handleChange}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <AspectRatioIcon fontSize="small" color="action" />
                                                </InputAdornment>
                                            )
                                        }}
                                        helperText="Enter the size of your farm"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Unit of Measurement</InputLabel>
                                        <Select
                                            name="land_unit"
                                            value={formData.land_unit || 'acres'}
                                            onChange={handleChange}
                                            label="Unit of Measurement"
                                            sx={{ borderRadius: 2 }}
                                        >
                                            <MenuItem value="acres">Acres (एकड़)</MenuItem>
                                            <MenuItem value="hectares">Hectares (हेक्टेयर)</MenuItem>
                                            <MenuItem value="cents">Cents (सेंट)</MenuItem>
                                            <MenuItem value="bigha">Bigha (बीघा)</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* ── Section: Location ── */}
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: '1px solid #e3f2fd', bgcolor: '#fafffe' }}>
                            <SectionHeader
                                icon={<LocationOnIcon fontSize="small" />}
                                title="Location"
                                subtitle="Used for weather integration and crop recommendations"
                            />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>State</InputLabel>
                                        <Select
                                            name="state"
                                            value={formData.state || 'Kerala'}
                                            onChange={handleChange}
                                            label="State"
                                            sx={{ borderRadius: 2, minHeight: 56 }}
                                        >
                                            {indianStates.map(s => (
                                                <MenuItem key={s} value={s}>{s}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="District / City"
                                        name="location"
                                        value={formData.location || ''}
                                        onChange={handleChange}
                                        placeholder="e.g. Thrissur, Ludhiana"
                                        helperText="🌦️ Used for live weather data"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LocationOnIcon fontSize="small" color="action" />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* ── Section: Soil ── */}
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: '1px solid #fce4ec', bgcolor: '#fafffe' }}>
                            <SectionHeader
                                icon={<TerrainIcon fontSize="small" />}
                                title="Soil Details"
                                subtitle="Soil type and pH determine fertilizer and crop choices"
                            />
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <FormControl fullWidth size="medium">
                                        <InputLabel id="soil-type-label" shrink>Soil Type *</InputLabel>
                                        <Select
                                            labelId="soil-type-label"
                                            name="soil_type"
                                            value={formData.soil_type || ''}
                                            onChange={handleChange}
                                            label="Soil Type *"
                                            displayEmpty
                                            notched
                                            sx={{
                                                borderRadius: 2,
                                                minHeight: 64,
                                                fontSize: '1rem',
                                                '& .MuiSelect-select': { py: 2, fontSize: '1rem' }
                                            }}
                                        >
                                            <MenuItem value="" disabled>
                                                <Typography color="text.secondary">Select your soil type...</Typography>
                                            </MenuItem>
                                            {soilTypes.map(({ value, label, desc }) => (
                                                <MenuItem key={value} value={value}>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">{label}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{desc}</Typography>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Soil pH (Optional)"
                                        name="soil_ph"
                                        type="number"
                                        inputProps={{ step: "0.1", min: "0", max: "14" }}
                                        value={formData.soil_ph || ''}
                                        onChange={handleChange}
                                        placeholder="e.g. 6.5"
                                        helperText="Ideal range: 6.0 – 7.5 for most crops"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <ScienceIcon fontSize="small" color="action" />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* ── Section: Season & Water ── */}
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: '1px solid #fff8e1', bgcolor: '#fafffe' }}>
                            <SectionHeader
                                icon={<WbSunnyIcon fontSize="small" />}
                                title="Season & Water"
                                subtitle="Determines crop suitability and irrigation schedule"
                            />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Season</InputLabel>
                                        <Select
                                            name="season"
                                            value={formData.season || ''}
                                            onChange={handleChange}
                                            label="Season"
                                            sx={{ borderRadius: 2 }}
                                        >
                                            <MenuItem value="Kharif">
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">☔ Kharif</Typography>
                                                    <Typography variant="caption" color="text.secondary">Monsoon season (June–Oct)</Typography>
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="Rabi">
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">❄️ Rabi</Typography>
                                                    <Typography variant="caption" color="text.secondary">Winter season (Nov–Apr)</Typography>
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="Zaid">
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">☀️ Zaid</Typography>
                                                    <Typography variant="caption" color="text.secondary">Summer season (Mar–Jun)</Typography>
                                                </Box>
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Water Availability</InputLabel>
                                        <Select
                                            name="water_availability"
                                            value={formData.water_availability || ''}
                                            onChange={handleChange}
                                            label="Water Availability"
                                            sx={{ borderRadius: 2 }}
                                        >
                                            <MenuItem value="High">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <WaterDropIcon sx={{ color: '#0288d1' }} fontSize="small" />
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">High</Typography>
                                                        <Typography variant="caption" color="text.secondary">Canal / Borewell available</Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="Moderate">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <WaterDropIcon sx={{ color: '#4caf50' }} fontSize="small" />
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">Moderate</Typography>
                                                        <Typography variant="caption" color="text.secondary">Seasonal availability</Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="Low">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <WaterDropIcon sx={{ color: '#ef5350' }} fontSize="small" />
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">Low</Typography>
                                                        <Typography variant="caption" color="text.secondary">Rainfed only</Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* ── Section: Budget ── */}
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: '1px solid #e8eaf6', bgcolor: '#fafffe' }}>
                            <SectionHeader
                                icon={<CurrencyRupeeIcon fontSize="small" />}
                                title="Budget (Optional)"
                                subtitle="Helps generate cost-effective recommendations"
                            />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Available Budget (₹)"
                                        name="budget"
                                        type="number"
                                        value={formData.budget || ''}
                                        onChange={handleChange}
                                        placeholder="e.g. 50000"
                                        helperText="Per acre budget for this season"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CurrencyRupeeIcon fontSize="small" color="action" />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                </Grid>
            </Box>
        );
    }

    if (activeStep === 1) {
        return (
            <Box>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold" color="success.dark">
                        🌱 Crop Selection
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Choose the crops you plan to grow this season.
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: '1px solid #e8f5e9', bgcolor: '#fafffe' }}>
                            <SectionHeader
                                icon={<EmojiNatureIcon fontSize="small" />}
                                title="Select Your Crops"
                                subtitle="You can select up to 3 crops for intercropping"
                            />

                            {recommendedCrops.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                                        ✨ AI Recommended for your soil & location:
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {recommendedCrops.map(crop => (
                                            <Chip
                                                key={crop}
                                                label={`${crop} ✨`}
                                                color="success"
                                                variant={formData.selected_crops?.includes(crop) ? 'filled' : 'outlined'}
                                                size="small"
                                                clickable
                                                onClick={() => {
                                                    const current = formData.selected_crops || [];
                                                    if (current.includes(crop)) {
                                                        setFormData(prev => ({ ...prev, selected_crops: current.filter(c => c !== crop) }));
                                                    } else if (current.length < 3) {
                                                        setFormData(prev => ({ ...prev, selected_crops: [...current, crop] }));
                                                    }
                                                }}
                                            />
                                        ))}
                                    </Box>
                                    <Divider sx={{ my: 2 }} />
                                </Box>
                            )}

                            <FormControl fullWidth>
                                <InputLabel>Select Crops (Max 3)</InputLabel>
                                <Select
                                    name="selected_crops"
                                    multiple
                                    value={formData.selected_crops || []}
                                    onChange={handleMultiChange}
                                    label="Select Crops (Max 3)"
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map(val => (
                                                <Chip key={val} label={val} size="small" color="success" />
                                            ))}
                                        </Box>
                                    )}
                                    sx={{ borderRadius: 2 }}
                                >
                                    {allCrops.map(crop => (
                                        <MenuItem key={crop} value={crop}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">{crop}</Typography>
                                                {formData.selected_crops?.includes(crop) && (
                                                    <Chip label="Selected" size="small" color="success" sx={{ ml: 1 }} />
                                                )}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {formData.selected_crops?.length > 0 && (
                                <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography variant="caption" color="text.secondary">Selected:</Typography>
                                    {formData.selected_crops.map(c => (
                                        <Chip key={c} label={c} size="small" onDelete={() => {
                                            setFormData(prev => ({ ...prev, selected_crops: prev.selected_crops.filter(x => x !== c) }));
                                        }} color="success" />
                                    ))}
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: '1px solid #e3f2fd', bgcolor: '#fafffe' }}>
                            <SectionHeader
                                icon={<CalendarTodayIcon fontSize="small" />}
                                title="Sowing Date"
                                subtitle="The AI will generate a day-by-day plan from this date"
                            />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Planned Sowing Date"
                                        name="sowing_date"
                                        type="date"
                                        InputLabelProps={{ shrink: true }}
                                        value={formData.sowing_date || ''}
                                        onChange={handleChange}
                                        helperText="Choose your intended sowing day"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarTodayIcon fontSize="small" color="action" />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Tip */}
                    <Grid item xs={12}>
                        <Box sx={{ bgcolor: '#e8f5e9', p: 2, borderRadius: 2, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <AgricultureIcon sx={{ color: '#2e7d32', mt: 0.3, flexShrink: 0 }} />
                            <Box>
                                <Typography variant="subtitle2" color="success.dark" fontWeight="bold">
                                    Pro Tip
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Based on your <strong>{formData.soil_type || 'selected'}</strong> soil type in <strong>{formData.state || 'your region'}</strong>, our AI will recommend the optimal crop variety, seed rate, and fertilizer schedule personalized to your farm.
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        );
    }

    return null;
};

export default CultivationStepper;
