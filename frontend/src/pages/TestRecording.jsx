import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { FileText, Save, AlertCircle, CheckCircle } from 'lucide-react';

const TestRecording = () => {
  const [formData, setFormData] = useState({
    // Batch Information
    batch_id: '',
    batch_number: '',
    product_name: '',
    
    // Test Details
    test_type: 'Assay',
    test_method: '',
    equipment_used: '',
    test_date: new Date().toISOString().split('T')[0],
    test_time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    
    // Results
    result_value: '',
    result_unit: '',
    specification_min: '',
    specification_max: '',
    
    // Additional Information
    comments: '',
    deviation_notes: '',
    retest_required: false
  });

  const [loading, setLoading] = useState(false);
  const [autoPassFail, setAutoPassFail] = useState(null);

  const testTypes = [
    'Assay',
    'Identity',
    'Dissolution',
    'Content Uniformity',
    'Microbial Limits',
    'Heavy Metals',
    'Residual Solvents',
    'Moisture Content',
    'Particulate Matter',
    'pH Test',
    'Related Substances',
    'Sterility Test'
  ];

  const equipmentList = [
    'HPLC-001',
    'HPLC-002',
    'UV-Spectrophotometer-001',
    'Dissolution Apparatus-001',
    'Karl Fischer Titrator',
    'GC-MS-001',
    'ICP-MS-001',
    'Microscope-001',
    'pH Meter-001'
  ];

  useEffect(() => {
    // Auto-calculate pass/fail status
    if (formData.result_value && formData.specification_min && formData.specification_max) {
      try {
        const result = parseFloat(formData.result_value);
        const min = parseFloat(formData.specification_min);
        const max = parseFloat(formData.specification_max);
        
        if (!isNaN(result) && !isNaN(min) && !isNaN(max)) {
          if (result >= min && result <= max) {
            setAutoPassFail('Pass');
          } else {
            setAutoPassFail('Fail');
          }
        } else {
          setAutoPassFail(null);
        }
      } catch (error) {
        setAutoPassFail(null);
      }
    } else {
      setAutoPassFail(null);
    }
  }, [formData.result_value, formData.specification_min, formData.specification_max]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateBatchId = () => {
    const timestamp = Date.now();
    return `BATCH-${timestamp}`;
  };

  const generateBatchNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BN${year}${month}${random}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.batch_number || !formData.product_name || !formData.result_value) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Create batch if new
      if (!formData.batch_id) {
        formData.batch_id = generateBatchId();
      }

      // Submit test record
      await axios.post(`${API}/tests`, formData);
      
      toast.success('Test record created successfully!');
      
      // Reset form
      setFormData({
        batch_id: '',
        batch_number: '',
        product_name: '',
        test_type: 'Assay',
        test_method: '',
        equipment_used: '',
        test_date: new Date().toISOString().split('T')[0],
        test_time: new Date().toTimeString().split(' ')[0].slice(0, 5),
        result_value: '',
        result_unit: '',
        specification_min: '',
        specification_max: '',
        comments: '',
        deviation_notes: '',
        retest_required: false
      });
      setAutoPassFail(null);
    } catch (error) {
      console.error('Error creating test record:', error);
      toast.error(error.response?.data?.detail || 'Failed to create test record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in" data-testid="test-recording-page">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <FileText className="w-8 h-8 text-cyan-600" />
          Record Quality Control Test
        </h1>
        <p className="text-slate-600">Enter test results and batch information for quality control testing</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Batch Information Section */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">Batch Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batch_number" className="text-slate-700 font-medium">
                    Batch Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="batch_number"
                      name="batch_number"
                      value={formData.batch_number}
                      onChange={handleChange}
                      placeholder="Enter batch number"
                      required
                      className="border-slate-300"
                      data-testid="batch-number-input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData(prev => ({ ...prev, batch_number: generateBatchNumber() }))}
                      className="whitespace-nowrap"
                      data-testid="generate-batch-button"
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product_name" className="text-slate-700 font-medium">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="product_name"
                    name="product_name"
                    value={formData.product_name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    required
                    className="border-slate-300"
                    data-testid="product-name-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Details Section */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">Test Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="test_type" className="text-slate-700 font-medium">
                    Test Type <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="test_type"
                    name="test_type"
                    value={formData.test_type}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    data-testid="test-type-select"
                  >
                    {testTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test_method" className="text-slate-700 font-medium">
                    Test Method / SOP Reference
                  </Label>
                  <Input
                    id="test_method"
                    name="test_method"
                    value={formData.test_method}
                    onChange={handleChange}
                    placeholder="e.g., USP <788>, SOP-QC-001"
                    className="border-slate-300"
                    data-testid="test-method-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipment_used" className="text-slate-700 font-medium">
                    Equipment Used
                  </Label>
                  <select
                    id="equipment_used"
                    name="equipment_used"
                    value={formData.equipment_used}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    data-testid="equipment-select"
                  >
                    <option value="">Select equipment</option>
                    {equipmentList.map(equipment => (
                      <option key={equipment} value={equipment}>{equipment}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test_date" className="text-slate-700 font-medium">
                    Test Date
                  </Label>
                  <Input
                    id="test_date"
                    name="test_date"
                    type="date"
                    value={formData.test_date}
                    onChange={handleChange}
                    className="border-slate-300"
                    data-testid="test-date-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test_time" className="text-slate-700 font-medium">
                    Test Time
                  </Label>
                  <Input
                    id="test_time"
                    name="test_time"
                    type="time"
                    value={formData.test_time}
                    onChange={handleChange}
                    className="border-slate-300"
                    data-testid="test-time-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">Test Results & Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="result_value" className="text-slate-700 font-medium">
                    Result Value <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="result_value"
                    name="result_value"
                    type="number"
                    step="any"
                    value={formData.result_value}
                    onChange={handleChange}
                    placeholder="Enter result"
                    required
                    className="border-slate-300"
                    data-testid="result-value-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="result_unit" className="text-slate-700 font-medium">
                    Unit
                  </Label>
                  <Input
                    id="result_unit"
                    name="result_unit"
                    value={formData.result_unit}
                    onChange={handleChange}
                    placeholder="e.g., mg, %, ppm"
                    className="border-slate-300"
                    data-testid="result-unit-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specification_min" className="text-slate-700 font-medium">
                    Min Specification
                  </Label>
                  <Input
                    id="specification_min"
                    name="specification_min"
                    type="number"
                    step="any"
                    value={formData.specification_min}
                    onChange={handleChange}
                    placeholder="Min limit"
                    className="border-slate-300"
                    data-testid="spec-min-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specification_max" className="text-slate-700 font-medium">
                    Max Specification
                  </Label>
                  <Input
                    id="specification_max"
                    name="specification_max"
                    type="number"
                    step="any"
                    value={formData.specification_max}
                    onChange={handleChange}
                    placeholder="Max limit"
                    className="border-slate-300"
                    data-testid="spec-max-input"
                  />
                </div>
              </div>

              {/* Auto Pass/Fail Indicator */}
              {autoPassFail && (
                <div
                  className={`p-4 rounded-lg flex items-center gap-3 ${
                    autoPassFail === 'Pass'
                      ? 'bg-emerald-50 border border-emerald-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                  data-testid="auto-pass-fail-indicator"
                >
                  {autoPassFail === 'Pass' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p
                      className={`font-semibold ${
                        autoPassFail === 'Pass' ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      Predicted Status: {autoPassFail}
                    </p>
                    <p
                      className={`text-sm ${
                        autoPassFail === 'Pass' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      Result {autoPassFail === 'Pass' ? 'is within' : 'is outside'} specification limits
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information Section */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comments" className="text-slate-700 font-medium">
                  Comments / Observations
                </Label>
                <Textarea
                  id="comments"
                  name="comments"
                  value={formData.comments}
                  onChange={handleChange}
                  placeholder="Enter any observations or comments"
                  rows={3}
                  className="border-slate-300 resize-none"
                  data-testid="comments-textarea"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviation_notes" className="text-slate-700 font-medium">
                  Deviation Notes (if applicable)
                </Label>
                <Textarea
                  id="deviation_notes"
                  name="deviation_notes"
                  value={formData.deviation_notes}
                  onChange={handleChange}
                  placeholder="Document any deviations from standard procedure"
                  rows={3}
                  className="border-slate-300 resize-none"
                  data-testid="deviation-textarea"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="retest_required"
                  name="retest_required"
                  checked={formData.retest_required}
                  onChange={handleChange}
                  className="w-4 h-4 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
                  data-testid="retest-checkbox"
                />
                <Label htmlFor="retest_required" className="text-slate-700 font-medium cursor-pointer">
                  Retest Required
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-8 py-6 text-base"
              data-testid="submit-test-button"
            >
              {loading ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Test Record
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TestRecording;
